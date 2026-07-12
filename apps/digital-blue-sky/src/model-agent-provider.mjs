import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { DMLError, hash, now } from './canonical.mjs';
import { buildVSRShadowOperations } from './development-loop.mjs';

const DENIED = ['.git/', 'node_modules/', '.dml-runtime/', '.env', 'state/', 'backups/'];
const TEXT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.md', '.txt', '.css', '.scss', '.html', '.py', '.go', '.rs', '.java', '.kt', '.cpp', '.c', '.h', '.hpp', '.glsl', '.wgsl', '.yaml', '.yml', '.toml']);

function safePath(value) {
  const normalized = String(value || '').replace(/\\/g, '/').replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('/') || normalized.includes('../') || /^[A-Za-z]:/.test(normalized)) {
    throw new DMLError('UNSAFE_AGENT_PATH', normalized);
  }
  if (DENIED.some((prefix) => normalized === prefix.replace(/\/$/, '') || normalized.startsWith(prefix))) {
    throw new DMLError('DENIED_AGENT_PATH', normalized);
  }
  return normalized;
}

export function validatePatchOperations(operations) {
  if (!Array.isArray(operations) || operations.length === 0) throw new DMLError('PATCH_OPERATIONS_REQUIRED', '代码 Provider 没有返回修改操作');
  if (operations.length > Number(process.env.DML_MAX_PATCH_OPERATIONS || 80)) throw new DMLError('PATCH_OPERATIONS_EXCEEDED', String(operations.length));
  return operations.map((operation) => {
    const type = String(operation?.type || '');
    if (!['write', 'replace', 'regex-replace', 'delete'].includes(type)) throw new DMLError('PATCH_TYPE_UNSUPPORTED', type);
    const normalized = { ...operation, type, path: safePath(operation.path) };
    if (type === 'write' && typeof normalized.content !== 'string') throw new DMLError('PATCH_CONTENT_REQUIRED', normalized.path);
    if (type === 'replace' && typeof normalized.search !== 'string') throw new DMLError('PATCH_SEARCH_REQUIRED', normalized.path);
    if (type === 'regex-replace' && typeof normalized.pattern !== 'string') throw new DMLError('PATCH_PATTERN_REQUIRED', normalized.path);
    return normalized;
  });
}

function walkTextFiles(root, limit = 800) {
  const files = [];
  const stack = [root];
  while (stack.length && files.length < limit) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (['.git', 'node_modules', '.dml-runtime', 'dist', 'build', 'outputs', 'state', 'backups'].includes(entry.name)) continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(absolute);
      else if (entry.isFile()) {
        const relative = path.relative(root, absolute).replace(/\\/g, '/');
        const info = fs.statSync(absolute);
        if (info.size <= 160_000 && (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) || ['Dockerfile', 'Makefile'].includes(entry.name))) {
          files.push({ path: relative, bytes: info.size });
        }
      }
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function instructionTerms(instruction) {
  return [...new Set(String(instruction || '').toLowerCase().match(/[a-z0-9_-]{3,}|[\u4e00-\u9fff]{2,}/g) || [])].slice(0, 30);
}

function selectContextFiles(root, instruction, maxFiles = 18, maxChars = 100_000) {
  const all = walkTextFiles(root);
  const terms = instructionTerms(instruction);
  const priorities = ['package.json', 'README.md', 'readme.md', 'src/index.mjs', 'src/index.ts', 'src/main.ts', 'src/main.tsx'];
  const scored = all.map((file) => {
    const lower = file.path.toLowerCase();
    let score = priorities.indexOf(file.path) >= 0 ? 100 - priorities.indexOf(file.path) : 0;
    for (const term of terms) if (lower.includes(term)) score += 12;
    if (/test|spec/.test(lower)) score += 3;
    if (/src\//.test(lower)) score += 2;
    return { ...file, score };
  }).sort((a, b) => b.score - a.score || a.bytes - b.bytes);
  const selected = [];
  let chars = 0;
  for (const file of scored) {
    if (selected.length >= maxFiles || chars >= maxChars) break;
    let content;
    try { content = fs.readFileSync(path.join(root, file.path), 'utf8'); } catch { continue; }
    const remaining = maxChars - chars;
    if (remaining <= 0) break;
    content = content.slice(0, remaining);
    selected.push({ path: file.path, content });
    chars += content.length;
  }
  return { all_files: all.map((file) => file.path), selected };
}

function extractJson(text) {
  const raw = String(text || '').trim();
  try { return JSON.parse(raw); } catch {}
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()); } catch {}
  }
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(raw.slice(start, end + 1)); } catch {}
  }
  throw new DMLError('AGENT_JSON_INVALID', raw.slice(0, 500));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function discoverOllama() {
  const baseUrl = String(process.env.DML_OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/tags`, {}, Number(process.env.DML_OLLAMA_DISCOVERY_TIMEOUT_MS || 2500));
    if (!response.ok) return null;
    const body = await response.json();
    const models = Array.isArray(body.models) ? body.models.map((item) => item.name || item.model).filter(Boolean) : [];
    if (!models.length) return null;
    const requested = process.env.DML_OLLAMA_MODEL;
    const model = requested && models.includes(requested) ? requested : requested || models[0];
    return { baseUrl, model, models };
  } catch {
    return null;
  }
}

function renderPatchPrompt({ task, context }) {
  const snippets = context.selected.map((file) => `\n--- FILE: ${file.path} ---\n${file.content}`).join('\n');
  return `你是数字蓝天机的本机代码修改 Provider。你的输出将被机械校验后，只应用到隔离候选分支。\n\n任务：\n${task.instruction}\n\n项目文件列表：\n${context.all_files.slice(0, 500).join('\n')}\n\n关键文件内容：${snippets}\n\n只返回一个 JSON 对象，不要返回 Markdown。格式必须是：\n{\n  "summary": "修改摘要",\n  "operations": [\n    {"type":"write","path":"相对路径","content":"完整文件内容"},\n    {"type":"replace","path":"相对路径","search":"精确原文","replace":"替换内容","expectedOccurrences":1}\n  ]\n}\n\n规则：\n1. 只能使用 write、replace、regex-replace、delete。\n2. 只能使用项目内相对路径，禁止 .env、.git、node_modules、state、backups。\n3. 修改必须最小、可验证，优先同时更新测试。\n4. write 必须给完整内容；replace 必须给可唯一匹配的精确原文。\n5. 没有足够信息时返回 {"summary":"blocked","operations":[],"reason":"具体缺失信息"}。`;
}

async function generateWithOllama({ task, branchPath }) {
  const ollama = await discoverOllama();
  if (!ollama) return null;
  const context = selectContextFiles(branchPath, task.instruction);
  const prompt = renderPatchPrompt({ task, context });
  const response = await fetchWithTimeout(`${ollama.baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: ollama.model,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: Number(process.env.DML_OLLAMA_TEMPERATURE || 0.1), num_ctx: Number(process.env.DML_OLLAMA_CONTEXT || 32768) },
    }),
  }, Number(process.env.DML_OLLAMA_TIMEOUT_MS || 15 * 60_000));
  if (!response.ok) throw new DMLError('OLLAMA_PROVIDER_FAILED', `${response.status} ${await response.text()}`);
  const body = await response.json();
  const payload = extractJson(body.response || '');
  if (!Array.isArray(payload.operations) || payload.operations.length === 0) {
    throw new DMLError('CODE_PROVIDER_BLOCKED', payload.reason || payload.summary || '本地模型没有生成修改');
  }
  return {
    provider: 'ollama',
    model: ollama.model,
    summary: payload.summary || '本地模型生成修改',
    operations: validatePatchOperations(payload.operations),
    evidence: [`Ollama 模型 ${ollama.model}`, `上下文文件 ${context.selected.length} 个`, `操作 ${payload.operations.length} 个`],
    receipt_root: hash({ provider: 'ollama', model: ollama.model, operations: payload.operations, at: now() }),
  };
}


async function generateWithOpenAICompatible({ task, branchPath }) {
  const baseUrl = String(process.env.DML_OPENAI_BASE_URL || '').replace(/\/$/, '');
  const apiKey = String(process.env.DML_OPENAI_API_KEY || '');
  const model = String(process.env.DML_OPENAI_MODEL || '');
  if (!baseUrl || !apiKey || !model) return null;
  const context = selectContextFiles(branchPath, task.instruction);
  const prompt = renderPatchPrompt({ task, context });
  const endpoint = `${baseUrl}/chat/completions`;
  const body = {
    model,
    temperature: Number(process.env.DML_OPENAI_TEMPERATURE || 0.1),
    messages: [
      { role: 'system', content: 'You are a local code modification provider. Return only valid JSON matching the user schema.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  };
  let response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  }, Number(process.env.DML_OPENAI_TIMEOUT_MS || 15 * 60_000));
  if (!response.ok && [400, 422].includes(response.status)) {
    delete body.response_format;
    response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    }, Number(process.env.DML_OPENAI_TIMEOUT_MS || 15 * 60_000));
  }
  if (!response.ok) throw new DMLError('OPENAI_PROVIDER_FAILED', `${response.status} ${await response.text()}`);
  const payload = await response.json();
  const parsed = extractJson(payload.choices?.[0]?.message?.content || '');
  if (!Array.isArray(parsed.operations) || parsed.operations.length === 0) {
    throw new DMLError('CODE_PROVIDER_BLOCKED', parsed.reason || parsed.summary || '兼容 API 没有生成修改');
  }
  return {
    provider: 'openai-compatible',
    model,
    summary: parsed.summary || '兼容 API 生成修改',
    operations: validatePatchOperations(parsed.operations),
    evidence: [`OpenAI 兼容模型 ${model}`, `上下文文件 ${context.selected.length} 个`, `操作 ${parsed.operations.length} 个`],
    receipt_root: hash({ provider: 'openai-compatible', model, operations: parsed.operations, at: now() }),
  };
}


function isVSRShadowTask(task, branchPath) {
  const instruction = String(task?.instruction || task?.payload?.instruction || '').toLowerCase();
  const matchesGoal = /(vsr|阴影|shadow)/i.test(instruction) && /(抖动|稳定|jitter|stabil)/i.test(instruction);
  const required = [
    'packages/spatial-reality-3d/src/index.ts',
    'tests/spatial-reality-3d.ts',
    'benchmarks/spatial-reality-3d.ts',
  ];
  return matchesGoal && required.every((relative) => fs.existsSync(path.join(branchPath, relative)));
}

function generateWithBuiltinVSRShadow({ task, branchPath }) {
  if (!isVSRShadowTask(task, branchPath)) return null;
  const operations = validatePatchOperations(buildVSRShadowOperations('stable'));
  return {
    provider: 'dml.builtin-vsr-shadow-v0.4.2',
    model: null,
    summary: '使用内置 VSR 阴影稳定 Provider 生成可验证修改',
    operations,
    evidence: ['匹配 VSR 阴影抖动任务', `内置结构化操作 ${operations.length} 个`, '修改仅应用到隔离候选现实'],
    receipt_root: hash({ provider: 'dml.builtin-vsr-shadow-v0.4.2', task: task.task_id, operations, at: now() }),
  };
}

function parseCommandEnv() {
  const raw = process.env.DML_AGENT_COMMAND_JSON;
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) && value.length && value.every((part) => typeof part === 'string') ? value : null;
  } catch { return null; }
}

function substitute(command, values) {
  return command.map((part) => part.replace(/\{([a-z_]+)\}/g, (match, key) => key in values ? String(values[key]) : match));
}

function commandInvocation(command) {
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(command[0])) {
    return [process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', ...command]];
  }
  return [command[0], command.slice(1)];
}

async function runExternalAgent({ task, branchPath, stateDir }) {
  const configured = parseCommandEnv();
  if (!configured) return null;
  const context = selectContextFiles(branchPath, task.instruction, 12, 70_000);
  const prompt = renderPatchPrompt({ task, context });
  const promptFile = path.join(stateDir, 'task-provider-input', `${task.task_id.replace(/[:]/g, '_')}.md`);
  const outputFile = path.join(stateDir, 'task-provider-output', `${task.task_id.replace(/[:]/g, '_')}.log`);
  fs.mkdirSync(path.dirname(promptFile), { recursive: true });
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(promptFile, prompt, 'utf8');
  const command = substitute(configured, { project_root: branchPath, prompt_file: promptFile, output_file: outputFile });
  const [file, args] = commandInvocation(command);
  const result = await new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    const child = spawn(file, args, { cwd: branchPath, env: { ...process.env, DML_AGENT_PROMPT_FILE: promptFile, DML_AGENT_PROJECT_ROOT: branchPath, DML_AGENT_OUTPUT_FILE: outputFile }, shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGTERM');
      reject(new DMLError('AGENT_TIMEOUT', '代码智能体执行超时'));
    }, Number(process.env.DML_AGENT_TIMEOUT_MS || 20 * 60_000));
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', (error) => { if (!settled) { settled = true; clearTimeout(timer); reject(new DMLError('AGENT_START_FAILED', error.message)); } });
    child.on('close', (code) => { if (!settled) { settled = true; clearTimeout(timer); code === 0 ? resolve({ code, stdout, stderr }) : reject(new DMLError('AGENT_EXECUTION_FAILED', stderr || stdout || `退出码 ${code}`)); } });
    child.stdin.end(process.env.DML_AGENT_STDIN === 'false' ? '' : prompt);
  });
  fs.writeFileSync(outputFile, `${result.stdout}\n${result.stderr}`.trimEnd() + '\n', 'utf8');
  return {
    provider: 'external-agent',
    command: command[0],
    summary: '外部代码智能体已修改候选现实',
    operations: null,
    evidence: [`外部智能体 ${command[0]}`, `退出码 ${result.code}`, `日志 ${outputFile}`],
    receipt_root: hash({ command, outputFile, at: now() }),
  };
}

export async function generateCodeChanges({ task, branchPath, stateDir }) {
  if (Array.isArray(task.payload?.patch_operations) && task.payload.patch_operations.length) {
    const operations = validatePatchOperations(task.payload.patch_operations);
    return { provider: 'structured-patch', summary: '使用任务内结构化修改', operations, evidence: [`结构化操作 ${operations.length} 个`], receipt_root: hash(operations) };
  }
  const builtinVSR = generateWithBuiltinVSRShadow({ task, branchPath });
  if (builtinVSR) return builtinVSR;
  const external = await runExternalAgent({ task, branchPath, stateDir });
  if (external) return external;
  const ollama = await generateWithOllama({ task, branchPath });
  if (ollama) return ollama;
  const compatible = await generateWithOpenAICompatible({ task, branchPath });
  if (compatible) return compatible;
  throw new DMLError('CODE_PROVIDER_REQUIRED', '未发现可用代码 Provider。可启动装有模型的 Ollama、配置 DML_AGENT_COMMAND_JSON，或配置 OpenAI 兼容 API。');
}

export function validateChangedPaths(changes) {
  for (const change of changes || []) safePath(change.path);
  return changes;
}
