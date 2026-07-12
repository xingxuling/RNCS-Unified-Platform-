import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { hash, now } from './canonical.mjs';

function commandInvocation(command, args = []) {
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(command)) {
    return [process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', command, ...args]];
  }
  return [command, args];
}

function probe(command, args = [], cwd = process.cwd()) {
  const [file, finalArgs] = commandInvocation(command, args);
  try {
    const result = spawnSync(file, finalArgs, {
      cwd,
      env: process.env,
      windowsHide: true,
      encoding: 'utf8',
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    });
    return {
      available: !result.error && result.status === 0,
      exit_code: result.status ?? -1,
      version: String(result.stdout || result.stderr || '').trim().split(/\r?\n/)[0] || null,
      error: result.error?.message || null,
    };
  } catch (error) {
    return { available: false, exit_code: -1, version: null, error: error.message };
  }
}

function parseCommand(raw) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) && value.length > 0 && value.every((part) => typeof part === 'string') ? value : null;
  } catch {
    return null;
  }
}

function readPackage(projectPath) {
  try {
    const file = path.join(projectPath, 'package.json');
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { file, value, scripts: value.scripts || {} };
  } catch {
    return { file: null, value: null, scripts: {} };
  }
}

function capability(capabilityId, available, options = {}) {
  return {
    capability_id: capabilityId,
    available: Boolean(available),
    status: available ? 'available' : 'unavailable',
    provider_id: options.provider_id || null,
    version: options.version || null,
    evidence: (options.evidence || []).filter(Boolean),
    reason: options.reason || null,
    authorization: options.authorization || 'local',
    reversible: options.reversible ?? true,
    risk: options.risk || 'low',
  };
}

function safeReadJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
  catch { return fallback; }
}

function verifiedSkillsFromProjection(projection) {
  return (projection?.state?.skills || []).filter((skill) => ['verified', '已验证', 'stable', '稳定技能'].includes(String(skill.level || skill.status || '')));
}

function normalize(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function selectRelevantSkills(goal, skills = []) {
  const text = normalize(goal);
  return skills.map((skill) => {
    const terms = [skill.name, ...(skill.applicability || []), ...(skill.trigger_conditions || [])]
      .map(normalize).filter(Boolean);
    const overlap = terms.reduce((score, term) => score + (text.includes(term) || term.includes(text)
      ? 3
      : term.split(/[\s,，。；;、]+/).filter((part) => part.length > 1 && text.includes(part)).length), 0);
    return {
      skill_id: skill.skill_id,
      name: skill.name,
      level: skill.level || skill.status || null,
      score: overlap + 2,
      evidence_root: skill.evidence_root || null,
    };
  }).filter((item) => item.score > 2).sort((a, b) => b.score - a.score);
}

function isVSRShadowGoal(goal) {
  const text = normalize(goal);
  return /(vsr|阴影|shadow)/i.test(text) && /(抖动|稳定|jitter|stabil)/i.test(text);
}

function expectedVSRFiles(projectPath) {
  return [
    'packages/spatial-reality-3d/src/index.ts',
    'tests/spatial-reality-3d.ts',
    'benchmarks/spatial-reality-3d.ts',
  ].map((relative) => path.join(projectPath, relative));
}

export class CapabilityClosure {
  constructor({ stateDir, projectPath = process.env.DML_DEFAULT_PROJECT_PATH || process.cwd() } = {}) {
    this.stateDir = path.resolve(stateDir || '.dml-runtime');
    this.stateFile = path.join(this.stateDir, 'capability-state.json');
    this.projectPath = path.resolve(projectPath || process.cwd());
    this.registry = null;
    this.plan = null;
    this.gaps = [];
    this.attempts = [];
    this.replans = [];
    this.skillMatches = [];
    this.restartRecovery = null;
    this.blockedAction = null;
    this.load();
  }

  load() {
    const previous = safeReadJson(this.stateFile, null);
    if (!previous) return;
    this.registry = previous.registry || null;
    this.plan = previous.plan || null;
    this.gaps = previous.gaps || [];
    this.attempts = previous.attempts || [];
    this.replans = previous.replans || [];
    this.skillMatches = previous.skill_matches || [];
    this.restartRecovery = previous.restart_recovery || null;
    this.blockedAction = previous.blocked_action || null;
  }

  save() {
    fs.mkdirSync(this.stateDir, { recursive: true });
    const value = {
      format: 'dml.capability-state.v0.4',
      registry: this.registry,
      plan: this.plan,
      gaps: this.gaps,
      attempts: this.attempts.slice(-200),
      replans: this.replans.slice(-100),
      skill_matches: this.skillMatches,
      restart_recovery: this.restartRecovery,
      blocked_action: this.blockedAction,
      saved_at: now(),
    };
    const temp = `${this.stateFile}.${process.pid}.tmp`;
    fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.renameSync(temp, this.stateFile);
  }

  scan({ projectPath = this.projectPath, projection = null } = {}) {
    const root = path.resolve(projectPath || this.projectPath);
    this.projectPath = root;
    const previousRoot = this.registry?.registry_root || null;
    const packageInfo = readPackage(root);
    const node = probe(process.execPath, ['--version'], root);
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const npm = probe(npmCommand, ['--version'], root);
    const git = probe('git', ['--version'], root);
    const gitInside = git.available ? probe('git', ['rev-parse', '--is-inside-work-tree'], root) : { available: false };
    const gitBranch = gitInside.available ? probe('git', ['branch', '--show-current'], root) : { version: null };
    const gitHead = gitInside.available ? probe('git', ['rev-parse', 'HEAD'], root) : { version: null };
    const python = probe('python', ['--version'], root);
    const python3 = python.available ? python : probe('python3', ['--version'], root);
    const testScript = ['dml:shadow-matrix', 'test:spatial-3d', 'test', 'test:integration', 'test:unit', 'check', 'verify']
      .find((name) => typeof packageInfo.scripts[name] === 'string')
      || Object.keys(packageInfo.scripts).find((name) => /^test(:|$)/.test(name))
      || null;
    const projectReadable = fs.existsSync(root) && fs.statSync(root).isDirectory();
    let stateWritable = false;
    let projectWritable = false;
    try {
      fs.mkdirSync(this.stateDir, { recursive: true });
      const testFile = path.join(this.stateDir, `.capability-write-${process.pid}.tmp`);
      fs.writeFileSync(testFile, 'ok', 'utf8');
      fs.rmSync(testFile, { force: true });
      stateWritable = true;
    } catch {}
    try {
      const projectProbe = path.join(root, `.dml-project-write-${process.pid}.tmp`);
      fs.writeFileSync(projectProbe, 'ok', 'utf8');
      fs.rmSync(projectProbe, { force: true });
      projectWritable = true;
    } catch {}
    const builtInVSR = expectedVSRFiles(root).every((file) => fs.existsSync(file))
      && Boolean(packageInfo.scripts['test:spatial-3d']);
    const agentCommand = parseCommand(process.env.DML_AGENT_COMMAND_JSON);
    const knownAgents = ['codex', 'opencode', 'claude', 'aider', 'cursor-agent'];
    const agentResults = Object.fromEntries(knownAgents.map((name) => [name, probe(name, ['--version'], root)]));
    const discoveredAgent = knownAgents.find((name) => agentResults[name].available) || null;
    const ollamaUrl = String(process.env.DML_OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
    const ollama = probe(process.execPath, ['-e', `fetch('${ollamaUrl}/api/tags',{signal:AbortSignal.timeout(1800)}).then(r=>r.json()).then(v=>{const m=(v.models||[])[0];if(!m)process.exit(2);console.log(m.name||m.model)}).catch(()=>process.exit(1))`], root);
    const openAICompatible = Boolean(process.env.DML_OPENAI_BASE_URL && process.env.DML_OPENAI_API_KEY && process.env.DML_OPENAI_MODEL);
    const networkEnabled = process.env.DML_NETWORK_ENABLED === 'true';
    const researchAvailable = expectedVSRFiles(root).every((file) => fs.existsSync(file));
    const branchProviderAvailable = projectReadable && stateWritable;
    const capabilities = [
      capability('filesystem.read', projectReadable, { provider_id: 'host.filesystem', evidence: projectReadable ? [root] : [], reason: projectReadable ? null : '项目目录不可读取' }),
      capability('filesystem.write', projectWritable, { provider_id: 'host.filesystem', evidence: projectWritable ? [root] : [], reason: projectWritable ? null : '项目目录不可写入', risk: 'medium' }),
      capability('process.spawn', node.available, { provider_id: 'node.child-process', version: node.version, evidence: [node.version], risk: 'medium' }),
      capability('runtime.node', node.available, { provider_id: 'node', version: node.version }),
      capability('package.manager.npm', npm.available, { provider_id: 'npm', version: npm.version, reason: npm.available ? null : '未找到 npm' }),
      capability('version-control.git', git.available, { provider_id: 'git', version: git.version, reason: git.available ? null : '未找到 Git' }),
      capability('version-control.branch', branchProviderAvailable, { provider_id: builtInVSR ? 'dml.reality-branch' : gitInside.available ? 'git' : 'dml.reality-branch', evidence: builtInVSR ? ['可逆候选目录与差异根'] : [], reason: branchProviderAvailable ? null : '无法创建候选分支', risk: 'medium' }),
      capability('version-control.clean-authority', Boolean(branchProviderAvailable && projectWritable), { provider_id: 'dml.branch-engine', evidence: branchProviderAvailable && projectWritable ? ['候选分支隔离，正式采用前建立备份'] : [], reason: branchProviderAvailable && projectWritable ? null : '正式项目不可写，无法安全采用候选结果' }),
      capability('project.package-manifest', Boolean(packageInfo.value), { provider_id: 'package.json', evidence: packageInfo.file ? [packageInfo.file] : [], reason: packageInfo.value ? null : '项目缺少 package.json' }),
      capability('project.test', Boolean(testScript && npm.available), { provider_id: testScript ? `npm-script:${testScript}` : null, evidence: testScript ? [`检测到测试脚本 ${testScript}`] : [], reason: testScript ? (npm.available ? null : '发现测试脚本但 npm 不可用') : '未发现测试脚本', risk: 'medium' }),
      capability('research.source', researchAvailable || networkEnabled, { provider_id: researchAvailable ? 'project-primary-sources' : networkEnabled ? 'network-research' : null, evidence: researchAvailable ? expectedVSRFiles(root) : networkEnabled ? ['网络研究已授权'] : [], reason: researchAvailable || networkEnabled ? null : '没有可用原始资料且网络未授权' }),
      capability('network.http', networkEnabled, { provider_id: networkEnabled ? 'host.network' : null, evidence: networkEnabled ? ['DML_NETWORK_ENABLED=true'] : [], reason: networkEnabled ? null : '网络访问未授权', risk: 'medium' }),
      capability('code.agent.discovered', Boolean(discoveredAgent || ollama.available || openAICompatible), { provider_id: discoveredAgent || (ollama.available ? 'ollama' : openAICompatible ? 'openai-compatible' : null), version: discoveredAgent ? agentResults[discoveredAgent].version : ollama.available ? ollama.version : process.env.DML_OPENAI_MODEL || null, evidence: ollama.available ? [`Ollama 模型 ${ollama.version}`] : openAICompatible ? [`兼容 API 模型 ${process.env.DML_OPENAI_MODEL}`] : [], reason: discoveredAgent || ollama.available || openAICompatible ? null : '未发现通用代码智能体、本机 Ollama 或兼容 API', risk: 'high' }),
      capability('code.agent.authorized', Boolean(agentCommand || ollama.available || openAICompatible), { provider_id: agentCommand?.[0] || (ollama.available ? 'ollama' : openAICompatible ? 'openai-compatible' : null), evidence: agentCommand ? ['DML_AGENT_COMMAND_JSON 已配置'] : ollama.available ? [`本机 Ollama 模型 ${ollama.version}`] : openAICompatible ? [`兼容 API 模型 ${process.env.DML_OPENAI_MODEL}`] : [], reason: agentCommand || ollama.available || openAICompatible ? null : (discoveredAgent ? `发现 ${discoveredAgent}，但未明确授权` : '没有已授权的代码修改 Provider'), authorization: agentCommand ? 'owner-configured' : ollama.available ? 'local-isolated-candidate' : openAICompatible ? 'owner-configured-api' : 'required', risk: 'high' }),
      capability('code.provider.ollama', ollama.available, { provider_id: ollama.available ? 'ollama' : null, version: ollama.version, evidence: ollama.available ? [`${ollamaUrl}/api/tags`] : [], reason: ollama.available ? null : '本机 Ollama 未运行或没有模型', risk: 'high' }),
      capability('code.provider.openai-compatible', openAICompatible, { provider_id: openAICompatible ? 'openai-compatible' : null, version: process.env.DML_OPENAI_MODEL || null, evidence: openAICompatible ? [process.env.DML_OPENAI_BASE_URL] : [], reason: openAICompatible ? null : '未配置兼容 API 的地址、密钥和模型', authorization: openAICompatible ? 'owner-configured-api' : 'required', risk: 'high' }),
      capability('code.provider.vsr-shadow', builtInVSR, { provider_id: builtInVSR ? 'dml.builtin-vsr-shadow-v0.4' : null, evidence: builtInVSR ? expectedVSRFiles(root) : [], reason: builtInVSR ? null : '当前项目不符合 VSR 阴影 Provider 契约', risk: 'medium' }),
      capability('skill.registry', true, { provider_id: 'dml.skill-registry', evidence: [`已验证技能 ${verifiedSkillsFromProjection(projection).length} 个`] }),
      capability('restart.resume', stateWritable, { provider_id: 'dml.capability-state-store', evidence: stateWritable ? [this.stateFile] : [], reason: stateWritable ? null : '无法保存恢复状态' }),
    ];
    const base = {
      format: 'dml.capability-registry.v0.4',
      scanned_at: now(),
      host: { platform: process.platform, arch: process.arch, node: process.version, pid: process.pid, python: python3.version },
      project: {
        root,
        package_file: packageInfo.file,
        scripts: packageInfo.scripts,
        test_script: testScript,
        git: { available: git.available, repository: gitInside.available, branch: gitBranch.version, head: gitHead.version },
        candidate_system: { provider_id: builtInVSR ? 'dml.reality-branch' : gitInside.available ? 'git-or-reality-branch' : 'dml.reality-branch', reversible: true, project_writable: projectWritable },
      },
      capabilities,
      available_count: capabilities.filter((item) => item.available).length,
      unavailable_count: capabilities.filter((item) => !item.available).length,
    };
    this.registry = { ...base, registry_root: hash(base) };
    this.restartRecovery = {
      restored: Boolean(previousRoot),
      environment_changed: Boolean(previousRoot && previousRoot !== this.registry.registry_root),
      previous_registry_root: previousRoot,
      current_registry_root: this.registry.registry_root,
      checked_at: now(),
    };
    this.save();
    return this.registry;
  }

  capability(id) {
    return this.registry?.capabilities?.find((item) => item.capability_id === id) || null;
  }

  buildPlan(goal, { projection = null } = {}) {
    const specialized = isVSRShadowGoal(goal) && this.capability('code.provider.vsr-shadow')?.available;
    const required = new Set(['filesystem.read', 'filesystem.write', 'process.spawn', 'version-control.branch', 'version-control.clean-authority', 'project.test', 'research.source', 'skill.registry', 'restart.resume']);
    required.add(specialized ? 'code.provider.vsr-shadow' : 'code.agent.authorized');
    const missing = [...required].filter((id) => !this.capability(id)?.available);
    const steps = [
      ['observe', '读取项目与环境', ['filesystem.read']],
      ['plan', '选择技能与 Provider', ['skill.registry']],
      ['research', '读取原始资料', ['research.source']],
      ['branch', '建立候选分支', ['version-control.branch', 'version-control.clean-authority']],
      ['modify', '执行代码修改', [specialized ? 'code.provider.vsr-shadow' : 'code.agent.authorized', 'filesystem.write']],
      ['verify', '运行真实测试', ['project.test', 'process.spawn']],
      ['commit', '等待批准并可逆采用', ['version-control.clean-authority']],
      ['resume', '保存经验并支持重启恢复', ['skill.registry', 'restart.resume']],
    ].map(([step_id, label, requirements]) => {
      const stepMissing = requirements.filter((id) => !this.capability(id)?.available);
      return {
        step_id,
        label,
        requirements,
        missing: stepMissing,
        status: stepMissing.length ? 'blocked' : 'ready',
        selected_providers: requirements.map((id) => ({ capability_id: id, provider_id: this.capability(id)?.provider_id || null })),
      };
    });
    this.skillMatches = selectRelevantSkills(goal, verifiedSkillsFromProjection(projection));
    const base = {
      format: 'dml.capability-plan.v0.4',
      goal,
      specialized_provider: specialized ? 'dml.builtin-vsr-shadow-v0.4' : null,
      required_capabilities: [...required],
      missing_capabilities: missing,
      skill_matches: this.skillMatches,
      steps,
      executable: missing.length === 0,
      created_at: now(),
    };
    this.plan = { ...base, plan_root: hash(base) };
    this.gaps = missing.map((capabilityId) => ({
      capability_id: capabilityId,
      reason: this.capability(capabilityId)?.reason || '能力不可用',
      detected_at: now(),
    }));
    this.save();
    return this.plan;
  }

  diagnose(error, stepId = null) {
    const code = String(error?.code || 'PROVIDER_ERROR');
    const message = String(error?.message || error || 'Unknown error');
    const lower = `${code} ${message}`.toLowerCase();
    if (/required|not_found|not found|enoent|unavailable|missing|capability/.test(lower)) return { kind: 'capability-gap', retryable: false, code, message, step_id: stepId, strategy: '重新扫描能力并等待 Provider 可用' };
    if (/timeout|ebusy|econnreset|temporar|429|503/.test(lower)) return { kind: 'transient', retryable: true, code, message, step_id: stepId, strategy: '退避后重试' };
    if (/permission|eperm|eacces|authority|approval/.test(lower)) return { kind: 'authority', retryable: false, code, message, step_id: stepId, strategy: '请求所有者授权' };
    if (/test|assert|regression/.test(lower)) return { kind: 'verification', retryable: false, code, message, step_id: stepId, strategy: '保留失败证据并重新规划' };
    return { kind: 'provider', retryable: false, code, message, step_id: stepId, strategy: '更换 Provider 或人工检查' };
  }

  recordAttempt({ actionType, status, error = null, diagnosis = null, startedAt, completedAt = now() }) {
    const record = {
      attempt_id: `attempt:${hash({ actionType, startedAt, completedAt, size: this.attempts.length }).slice(0, 24)}`,
      action_type: actionType,
      status,
      started_at: startedAt,
      completed_at: completedAt,
      error: error ? { code: error.code || 'ERROR', message: error.message || String(error) } : null,
      diagnosis,
    };
    this.attempts.push(record);
    this.save();
    return record;
  }

  recordReplan({ actionType, diagnosis, action }) {
    const record = {
      replan_id: `replan:${hash({ actionType, diagnosis, action, at: now() }).slice(0, 24)}`,
      action_type: actionType,
      diagnosis,
      action,
      created_at: now(),
    };
    this.replans.push(record);
    this.save();
    return record;
  }

  projectionState() {
    return {
      capability_registry: this.registry,
      capabilities: this.registry?.capabilities || [],
      capability_plan: this.plan,
      capability_gaps: this.gaps,
      provider_attempts: this.attempts,
      replans: this.replans,
      skill_matches: this.skillMatches,
      restart_recovery: this.restartRecovery,
      blocked_action: this.blockedAction,
    };
  }
}
