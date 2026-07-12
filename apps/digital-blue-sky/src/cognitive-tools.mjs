import fs from 'node:fs';
import path from 'node:path';
import { DMLError, hash } from './canonical.mjs';

const DENIED = ['.git/', 'node_modules/', '.dml-runtime/', '.env', 'state/', 'backups/'];
const TEXT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.md', '.txt', '.css', '.html', '.py', '.go', '.rs', '.java', '.kt', '.cpp', '.c', '.h', '.hpp', '.glsl', '.wgsl', '.yaml', '.yml', '.toml']);

function safePath(root, value) {
  const normalized = String(value || '').replace(/\\/g, '/').replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('/') || normalized.includes('../') || /^[A-Za-z]:/.test(normalized)) throw new DMLError('UNSAFE_COGNITIVE_PATH', normalized);
  if (DENIED.some((prefix) => normalized === prefix.replace(/\/$/, '') || normalized.startsWith(prefix))) throw new DMLError('DENIED_COGNITIVE_PATH', normalized);
  const resolved = path.resolve(root, normalized);
  if (resolved !== path.resolve(root) && !resolved.startsWith(`${path.resolve(root)}${path.sep}`)) throw new DMLError('UNSAFE_COGNITIVE_PATH', normalized);
  return { normalized, resolved };
}

function walk(root, limit = 800) {
  const files = [];
  const stack = [root];
  while (stack.length && files.length < limit) {
    const current = stack.pop();
    let entries = [];
    try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (['.git', 'node_modules', '.dml-runtime', 'dist', 'build', 'state', 'backups'].includes(entry.name)) continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(absolute);
      else if (entry.isFile()) files.push(path.relative(root, absolute).replace(/\\/g, '/'));
      if (files.length >= limit) break;
    }
  }
  return files.sort();
}

function taskSummary(activeTask) {
  if (!activeTask) return { status: 'idle', message: '当前没有活动任务。' };
  const operations = activeTask.plan?.operations || [];
  const completed = operations.filter((operation) => operation.status === 'completed').length;
  const current = operations.find((operation) => ['running', 'waiting', 'failed', 'waiting_approval'].includes(operation.status));
  return {
    task_id: activeTask.task_id || activeTask.contract?.task_id,
    instruction: activeTask.contract?.instruction,
    status: activeTask.status,
    progress: `${completed}/${operations.length}`,
    current_operation: current ? { type: current.type, title: current.title, status: current.status, error: current.error || null } : null,
    candidates: activeTask.candidates?.length || 0,
    artifacts: activeTask.artifacts?.length || 0,
  };
}

export function cognitiveToolCatalog() {
  return [
    { name: 'task.status', description: '读取当前真实任务的状态、进度、失败原因和候选产物。', arguments: {} },
    { name: 'project.summary', description: '扫描当前项目的文件、package.json、脚本和规模。', arguments: {} },
    { name: 'project.search', description: '按关键词搜索项目内文件名和文本内容。', arguments: { query: 'string', limit: 'number?' } },
    { name: 'file.read', description: '读取项目内一个文本文件。', arguments: { path: 'string', max_chars: 'number?' } },
    { name: 'capability.status', description: '读取当前能力注册表、缺口和 Provider 状态。', arguments: {} },
    { name: 'memory.recall', description: '检索历史对话和已记住事实。', arguments: { query: 'string', limit: 'number?' } },
  ];
}

export async function executeCognitiveTool(name, args = {}, context = {}) {
  const projectRoot = path.resolve(context.projectPath || process.cwd());
  switch (name) {
    case 'task.status':
      return taskSummary(context.activeTask);
    case 'capability.status':
      return {
        registry: context.capability?.registry || null,
        plan: context.capability?.plan || null,
        gaps: context.capability?.gaps || [],
        cognitive: context.cognitiveStatus || null,
      };
    case 'memory.recall':
      return { matches: context.memory?.recall(args.query || '', { project_id: context.projectId, limit: Math.max(1, Math.min(20, Number(args.limit || 8))) }) || [] };
    case 'project.summary': {
      const files = walk(projectRoot, 600);
      let pkg = null;
      try { pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')); } catch {}
      return {
        root: projectRoot,
        file_count: files.length,
        files: files.slice(0, 240),
        package: pkg ? { name: pkg.name || null, version: pkg.version || null, scripts: pkg.scripts || {}, dependencies: Object.keys(pkg.dependencies || {}), devDependencies: Object.keys(pkg.devDependencies || {}) } : null,
        manifest_root: hash(files),
      };
    }
    case 'file.read': {
      const { normalized, resolved } = safePath(projectRoot, args.path);
      if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) throw new DMLError('COGNITIVE_FILE_NOT_FOUND', normalized);
      const ext = path.extname(resolved).toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext) && !['Dockerfile', 'Makefile'].includes(path.basename(resolved))) throw new DMLError('COGNITIVE_BINARY_FILE_DENIED', normalized);
      const maxChars = Math.max(1000, Math.min(120_000, Number(args.max_chars || 32_000)));
      const content = fs.readFileSync(resolved, 'utf8');
      return { path: normalized, bytes: Buffer.byteLength(content), content: content.slice(0, maxChars), truncated: content.length > maxChars, sha256: hash([...Buffer.from(content)]) };
    }
    case 'project.search': {
      const query = String(args.query || '').trim();
      if (!query) throw new DMLError('COGNITIVE_SEARCH_QUERY_REQUIRED', 'query');
      const lower = query.toLowerCase();
      const limit = Math.max(1, Math.min(80, Number(args.limit || 20)));
      const matches = [];
      for (const relative of walk(projectRoot, 1200)) {
        if (matches.length >= limit) break;
        if (relative.toLowerCase().includes(lower)) matches.push({ path: relative, kind: 'path' });
        const absolute = path.join(projectRoot, relative);
        const ext = path.extname(absolute).toLowerCase();
        if (!TEXT_EXTENSIONS.has(ext)) continue;
        let content;
        try {
          const info = fs.statSync(absolute);
          if (info.size > 220_000) continue;
          content = fs.readFileSync(absolute, 'utf8');
        } catch { continue; }
        const index = content.toLowerCase().indexOf(lower);
        if (index >= 0) matches.push({ path: relative, kind: 'content', excerpt: content.slice(Math.max(0, index - 160), index + query.length + 240) });
      }
      return { query, matches: matches.slice(0, limit) };
    }
    default:
      throw new DMLError('COGNITIVE_TOOL_UNSUPPORTED', name);
  }
}
