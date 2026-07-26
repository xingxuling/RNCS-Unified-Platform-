import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { DMLError, hash, id, now } from './canonical.mjs';
import { createRealityBranch, applyBranchChanges, diffRealityBranch, commitRealityBranch } from './branch-engine.mjs';
import { runProjectScript } from './experiment-runner.mjs';
import { inspectProject } from './project-provider.mjs';
import { generateCodeChanges, validateChangedPaths } from './model-agent-provider.mjs';
import { createTaskResult } from './task-contract.mjs';

function safeRelativePath(value) {
  const normalized = String(value || '').replace(/\\/g, '/').replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('/') || normalized.includes('../') || /^[A-Za-z]:/.test(normalized)) throw new DMLError('UNSAFE_TASK_PATH', normalized);
  if (normalized === '.env' || normalized.startsWith('.env.') || normalized.startsWith('.git/') || normalized.startsWith('node_modules/') || normalized.startsWith('state/')) throw new DMLError('DENIED_TASK_PATH', normalized);
  return normalized;
}

function resolveInside(root, relative) {
  const safe = safeRelativePath(relative);
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, safe);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) throw new DMLError('TASK_PATH_OUTSIDE_PROJECT', safe);
  return { safe, resolved };
}

function persistTask(stateDir, state) {
  const file = path.join(stateDir, 'tasks', `${state.task_id.replace(/[:]/g, '_')}.json`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, file);
  return file;
}

export function persistTaskState(stateDir, state) {
  return persistTask(stateDir, state);
}

function errorText(error) {
  if (!error) return '未知错误';
  if (typeof error === 'string') return error;
  if (typeof error.message === 'string' && error.message.trim()) return error.message.trim();
  try { return JSON.stringify(error); } catch { return String(error); }
}

function backupFile({ projectPath, stateDir, taskId, relativePath }) {
  const { safe, resolved } = resolveInside(projectPath, relativePath);
  const backup = path.join(stateDir, 'task-backups', taskId.replace(/[:]/g, '_'), safe);
  if (!fs.existsSync(resolved)) return { existed: false, backup_path: null, previous_root: null };
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(resolved, backup);
  return { existed: true, backup_path: backup, previous_root: hash([...fs.readFileSync(resolved)]) };
}

function approved(approval) {
  return approval?.decision === 'approved' && Array.isArray(approval.approver_roles) && approval.approver_roles.includes('owner');
}

function commandInvocation(command) {
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(command[0])) {
    return [process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', ...command]];
  }
  return [command[0], command.slice(1)];
}

async function runExplicitCommand(command, { cwd, timeoutMs, maxOutputBytes, env = {} }) {
  if (!Array.isArray(command) || !command.length || command.some((part) => typeof part !== 'string' || !part)) throw new DMLError('INVALID_TASK_COMMAND', '命令必须是字符串数组');
  const [file, args] = commandInvocation(command);
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    const child = spawn(file, args, { cwd, env: { ...process.env, ...env }, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const done = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error); else resolve(value);
    };
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      done(new DMLError('TASK_COMMAND_TIMEOUT', `命令超过 ${timeoutMs} ms`));
    }, timeoutMs);
    child.stdout.on('data', (chunk) => { stdout = (stdout + chunk.toString()).slice(-maxOutputBytes); });
    child.stderr.on('data', (chunk) => { stderr = (stderr + chunk.toString()).slice(-maxOutputBytes); });
    child.on('error', (error) => done(new DMLError('TASK_COMMAND_START_FAILED', error.message)));
    child.on('close', (code, signal) => {
      const result = { exit_code: code ?? -1, signal: signal || null, stdout, stderr, command: [file, ...args] };
      if (result.exit_code !== 0) done(Object.assign(new DMLError('TASK_COMMAND_FAILED', stderr || stdout || `退出码 ${result.exit_code}`), { result }));
      else done(null, result);
    });
  });
}

function operationStep(operation) {
  return { step_id: operation.operation_id, label: operation.title || operation.type, status: operation.status === 'completed' ? 'completed' : operation.status === 'running' ? 'running' : operation.status === 'failed' ? 'failed' : 'waiting' };
}

export class TaskExecutor {
  constructor({ stateDir, projectPath, branchesRoot = null, backupRoot = null } = {}) {
    this.stateDir = path.resolve(stateDir);
    this.projectPath = path.resolve(projectPath);
    this.branchesRoot = path.resolve(branchesRoot || path.join(this.stateDir, 'task-branches'));
    this.backupRoot = path.resolve(backupRoot || path.join(this.stateDir, 'backups'));
  }

  async execute({ state, approval = null, selectedCandidateId = null, emit = () => {}, shouldPause = () => false } = {}) {
    state.status = 'running';
    state.updated_at = now();
    persistTask(this.stateDir, state);
    for (let index = 0; index < state.plan.operations.length; index += 1) {
      const operation = state.plan.operations[index];
      if (operation.status === 'completed') continue;
      if (shouldPause()) {
        state.status = 'paused';
        state.active_operation_index = index;
        state.updated_at = now();
        persistTask(this.stateDir, state);
        return { state, result: createTaskResult(state) };
      }
      if (operation.requires_approval && !approved(approval)) {
        operation.status = 'waiting_approval';
        state.status = 'waiting_approval';
        state.active_operation_index = index;
        state.error = { code: 'TASK_APPROVAL_REQUIRED', message: `${operation.title || operation.type}需要所有者批准`, operation_id: operation.operation_id, occurred_at: now() };
        state.updated_at = now();
        persistTask(this.stateDir, state);
        emit('approval', operation, { artifact: state.artifacts[0] || null, candidates: state.candidates });
        return { state, result: createTaskResult(state) };
      }

      operation.status = 'running';
      operation.started_at = now();
      delete operation.error;
      state.error = null;
      state.active_operation_index = index;
      state.updated_at = operation.started_at;
      persistTask(this.stateDir, state);
      emit('started', operation, {});
      try {
        const outcome = await this.executeOperation({ state, operation, approval, selectedCandidateId });
        operation.status = 'completed';
        operation.completed_at = now();
        operation.evidence = outcome.evidence || [];
        if (outcome.output) state.outputs.push(outcome.output);
        if (Array.isArray(outcome.artifacts)) state.artifacts.push(...outcome.artifacts);
        if (Array.isArray(outcome.changed_files)) state.changed_files = outcome.changed_files;
        if (Array.isArray(outcome.candidates)) state.candidates = outcome.candidates;
        state.evidence.push(...(outcome.evidence || []));
        state.error = null;
        emit('completed', operation, outcome);
      } catch (error) {
        operation.status = error.code === 'TASK_APPROVAL_REQUIRED' ? 'waiting_approval' : 'failed';
        operation.completed_at = now();
        operation.error = { code: error.code || 'TASK_OPERATION_FAILED', message: errorText(error) };
        state.status = operation.status === 'waiting_approval' ? 'waiting_approval' : 'failed';
        state.error = { ...operation.error, operation_id: operation.operation_id, occurred_at: now() };
        state.updated_at = now();
        persistTask(this.stateDir, state);
        emit(operation.status === 'waiting_approval' ? 'approval' : 'failed', operation, { error: state.error });
        return { state, result: createTaskResult(state) };
      }
      state.updated_at = now();
      persistTask(this.stateDir, state);
    }

    state.status = 'completed';
    state.completed_at = now();
    state.updated_at = state.completed_at;
    state.result = createTaskResult(state);
    persistTask(this.stateDir, state);
    return { state, result: state.result };
  }

  async executeOperation({ state, operation, approval, selectedCandidateId }) {
    const task = state.contract;
    switch (operation.type) {
      case 'project.inspect': {
        const snapshot = inspectProject(this.projectPath, operation.limit || 500);
        return { output: { type: 'project-snapshot', ...snapshot }, evidence: [`扫描 ${snapshot.file_count} 个文件`, `项目快照根 ${snapshot.snapshot_root}`] };
      }
      case 'project.status': {
        const packageFile = path.join(this.projectPath, 'package.json');
        let pkg = null;
        if (fs.existsSync(packageFile)) pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
        const output = { type: 'project-status', project_path: this.projectPath, package: pkg ? { name: pkg.name || null, version: pkg.version || null, scripts: pkg.scripts || {} } : null };
        return { output, evidence: [pkg ? `识别 package.json：${pkg.name || '未命名项目'}` : '项目没有 package.json'] };
      }
      case 'file.read': {
        const { safe, resolved } = resolveInside(this.projectPath, operation.path);
        const content = fs.readFileSync(resolved);
        return { output: { type: 'file-read', path: safe, bytes: content.byteLength, root: hash([...content]), content: content.toString('utf8').slice(0, Number(task.constraints.max_output_bytes || 2_000_000)) }, evidence: [`真实读取 ${safe}`, `文件根 ${hash([...content])}`] };
      }
      case 'file.write': {
        const { safe, resolved } = resolveInside(this.projectPath, operation.path);
        const backup = backupFile({ projectPath: this.projectPath, stateDir: this.stateDir, taskId: task.task_id, relativePath: safe });
        fs.mkdirSync(path.dirname(resolved), { recursive: true });
        const temp = `${resolved}.${process.pid}.tmp`;
        fs.writeFileSync(temp, String(operation.content ?? ''), 'utf8');
        fs.renameSync(temp, resolved);
        const buffer = fs.readFileSync(resolved);
        return { output: { type: 'file-write', path: safe, bytes: buffer.byteLength, root: hash([...buffer]), backup }, changed_files: [safe], evidence: [`真实写入 ${safe}`, `文件根 ${hash([...buffer])}`, backup.existed ? `原文件备份到 ${backup.backup_path}` : '创建新文件'] };
      }
      case 'file.verify': {
        const { safe, resolved } = resolveInside(this.projectPath, operation.path);
        if (!fs.existsSync(resolved)) throw new DMLError('FILE_VERIFY_FAILED', safe);
        const buffer = fs.readFileSync(resolved);
        return { output: { type: 'file-verification', path: safe, bytes: buffer.byteLength, root: hash([...buffer]) }, evidence: [`验证 ${safe} 存在`, `文件根 ${hash([...buffer])}`] };
      }
      case 'package.script': {
        const receipt = await runProjectScript({ projectPath: this.projectPath, script: operation.script, timeoutMs: Number(task.constraints.max_command_seconds || 600) * 1000, evidenceDir: path.join(this.stateDir, 'evidence') });
        if (receipt.status !== 'passed') throw Object.assign(new DMLError('PROJECT_SCRIPT_FAILED', `${operation.script} 退出码 ${receipt.exit_code}`), { receipt });
        return { output: { type: 'package-script', ...receipt }, evidence: [`真实执行 npm run ${operation.script}`, `退出码 ${receipt.exit_code}`, `证据根 ${receipt.evidence_root}`] };
      }
      case 'command.exec': {
        let command = operation.command;
        if (!command && operation.shell_text) command = process.platform === 'win32' ? [process.env.ComSpec || 'cmd.exe', '/d', '/s', '/c', operation.shell_text] : [process.env.SHELL || '/bin/sh', '-lc', operation.shell_text];
        const result = await runExplicitCommand(command, { cwd: this.projectPath, timeoutMs: Number(task.constraints.max_command_seconds || 600) * 1000, maxOutputBytes: Number(task.constraints.max_output_bytes || 2_000_000), env: { DML_TASK_ID: task.task_id, DML_OPERATION_ID: operation.operation_id } });
        return { output: { type: 'command', ...result }, evidence: [`真实执行明确命令`, `退出码 ${result.exit_code}`] };
      }
      case 'candidate.create': {
        const branch = createRealityBranch({ sourcePath: this.projectPath, branchesRoot: this.branchesRoot, projectId: task.project_id, label: `任务候选：${task.instruction}`, strategy: { kind: 'generic-task', instruction: task.instruction }, copyDist: false });
        return { output: { type: 'candidate-created', branch }, candidates: [branch], evidence: [`创建隔离候选现实 ${branch.branch_id}`, `候选目录 ${branch.branch_path}`, `基线根 ${branch.base_root}`] };
      }
      case 'candidate.modify': {
        const branch = state.candidates[0];
        if (!branch) throw new DMLError('TASK_BRANCH_REQUIRED', '尚未创建候选现实');
        const provider = await generateCodeChanges({ task, branchPath: branch.branch_path, stateDir: this.stateDir });
        let patch = null;
        if (provider.operations) patch = applyBranchChanges(branch, provider.operations);
        const diff = diffRealityBranch(branch);
        validateChangedPaths(diff.changes);
        if (!diff.changes.length) throw new DMLError('CODE_PROVIDER_NO_CHANGES', '代码 Provider 没有产生真实差异');
        const candidate = { ...branch, provider: provider.provider, provider_model: provider.model || null, provider_receipt_root: provider.receipt_root, patch, diff, changed_files: diff.changes.map((item) => item.path), status: 'changed' };
        return { output: { type: 'candidate-modified', provider, patch, diff }, candidates: [candidate], changed_files: candidate.changed_files, evidence: [...(provider.evidence || []), `真实差异 ${diff.changes.length} 个文件`, `差异根 ${diff.diff_root}`] };
      }
      case 'candidate.test': {
        const candidates = state.candidates;
        if (!candidates.length) throw new DMLError('TASK_BRANCH_REQUIRED', '没有候选现实');
        const receipts = [];
        for (const candidate of candidates) {
          let finalReceipt = null;
          for (let attempt = 1; attempt <= 2; attempt += 1) {
            const receipt = await runProjectScript({
              projectPath: candidate.branch_path,
              dependencySourcePath: candidate.source_path,
              script: operation.script,
              timeoutMs: Math.min(
                Number(task.constraints.max_command_seconds || 600),
                Number(operation.timeout_seconds || task.constraints.max_command_seconds || 600),
              ) * 1000,
              evidenceDir: path.join(this.stateDir, 'evidence'),
            });
            finalReceipt = { branch_id: candidate.branch_id, attempt, ...receipt };
            receipts.push(finalReceipt);
            if (receipt.status === 'passed') break;
            if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500));
          }
          if (!finalReceipt || finalReceipt.status !== 'passed') {
            const detail = finalReceipt?.stderr_excerpt || finalReceipt?.stdout_excerpt || `退出码 ${finalReceipt?.exit_code ?? '未知'}`;
            throw Object.assign(
              new DMLError('CANDIDATE_TEST_FAILED', `候选现实 ${candidate.branch_id} 的 ${operation.script} 测试失败：${String(detail).slice(-1200)}`),
              { receipts },
            );
          }
        }
        const passedReceipts = receipts.filter((item) => item.status === 'passed');
        state.candidates = state.candidates.map((candidate) => ({
          ...candidate,
          status: 'tested',
          tests: passedReceipts.filter((receipt) => receipt.branch_id === candidate.branch_id),
        }));
        return {
          output: { type: 'candidate-tests', script: operation.script, receipts },
          candidates: state.candidates,
          evidence: [
            `${state.candidates.length}/${state.candidates.length} 个候选真实测试通过`,
            `脚本 npm run ${operation.script}`,
            ...passedReceipts.map((receipt) => `测试证据根 ${receipt.evidence_root}`),
          ],
        };
      }
      case 'candidate.present': {
        const artifacts = state.candidates.map((candidate) => ({
          artifact_id: id('artifact:task-candidate', { task_id: task.task_id, branch_id: candidate.branch_id, diff_root: candidate.diff?.diff_root }),
          title: candidate.label || '任务候选结果',
          summary: `${candidate.changed_files?.length || candidate.diff?.changes?.length || 0} 个文件已修改${candidate.tests ? '，测试通过' : ''}`,
          status: 'candidate',
          root: candidate.diff?.diff_root || candidate.base_root,
          branch_id: candidate.branch_id,
          branch_path: candidate.branch_path,
          source_path: candidate.source_path,
          base_root: candidate.base_root,
          changed_files: candidate.changed_files || candidate.diff?.changes?.map((item) => item.path) || [],
          provider: candidate.provider || null,
        }));
        return { output: { type: 'candidate-presentation', candidates: state.candidates }, artifacts, evidence: [`展示 ${artifacts.length} 个真实候选结果`] };
      }
      case 'candidate.adopt': {
        if (!approved(approval)) throw new DMLError('TASK_APPROVAL_REQUIRED', '采用候选结果需要所有者批准');
        const candidate = selectedCandidateId ? state.candidates.find((item) => item.branch_id === selectedCandidateId) : state.candidates[0];
        if (!candidate) throw new DMLError('TASK_CANDIDATE_NOT_FOUND', String(selectedCandidateId || ''));
        const receipt = commitRealityBranch({ branch: candidate, backupRoot: this.backupRoot });
        const changed = receipt.committed.map((item) => item.path);
        return { output: { type: 'candidate-adoption', receipt }, changed_files: changed, candidates: state.candidates.map((item) => ({ ...item, status: item.branch_id === candidate.branch_id ? 'committed' : item.status })), evidence: [`所有者批准采用 ${candidate.branch_id}`, `正式项目更新 ${changed.length} 个文件`, `提交回执 ${receipt.receipt_root}`] };
      }
      case 'task.block': throw new DMLError('TASK_NEEDS_CLARIFICATION', operation.reason || '任务目标不够明确');
      default: throw new DMLError('TASK_OPERATION_UNSUPPORTED', operation.type);
    }
  }
}

export function taskPlanSteps(state) {
  return state.plan.operations.map(operationStep);
}

export function loadInterruptedTask(stateDir) {
  const tasksDir = path.join(stateDir, 'tasks');
  if (!fs.existsSync(tasksDir)) return null;
  const files = fs.readdirSync(tasksDir).filter((file) => file.endsWith('.json')).map((file) => path.join(tasksDir, file));
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  for (const file of files) {
    try {
      const state = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (['running', 'paused', 'waiting_approval', 'failed', 'blocked', 'queued'].includes(state.status)) return state;
    } catch {}
  }
  return null;
}
