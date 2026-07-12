import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { negotiate } from '@taowind/capability-negotiation-protocol';
import { buildDMLProvider } from './capabilities.mjs';
import { clone, DMLError, hash, id } from './canonical.mjs';
import { semanticActionToCNPRequest } from './compiler.mjs';
import { normalizeProjection, normalizeSemanticAction } from './contracts.mjs';
import { buildProposedEnvelope, decideAuthority, authoritySummary } from './authority.mjs';
import { EventStore } from './store.mjs';
import { projectEvents } from './projection.mjs';
import { inspectProject } from './project-provider.mjs';
import { runVSRShadowDevelopmentLoop } from './development-loop.mjs';
import { commitRealityBranch } from './branch-engine.mjs';
import { runProjectScript } from './experiment-runner.mjs';
import { createSkillCapsule } from './learning-model.mjs';
import { CapabilityClosure } from './capability-closure.mjs';
import { createTaskContract, createTaskState, createTaskResult } from './task-contract.mjs';
import { planTask } from './task-planner.mjs';
import { TaskExecutor, loadInterruptedTask, persistTaskState, taskPlanSteps } from './task-executor.mjs';

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const unifiedRoot = path.resolve(sourceDir, '..', '..', '..');
const authoritativeVSRProject = path.join(unifiedRoot, 'packages', 'world', 'visual-state-runtime');

/**
 * Maps legacy bundled VSR project references to the single authoritative
 * workspace module. Existing real paths are never rewritten.
 */
export function resolveUnifiedProjectPath(value) {
  const candidate = path.resolve(value || process.cwd());
  if (fs.existsSync(candidate)) return candidate;
  const normalized = candidate.replace(/\\/g, '/');
  if (/\/projects\/VSR_v0\.4\.0-alpha\.1$/i.test(normalized) && fs.existsSync(authoritativeVSRProject)) {
    return authoritativeVSRProject;
  }
  return candidate;
}

const defaultSubject = {
  subject_id: 'subject:dml:blue-tianji-001',
  kind: 'digital-mechanical-life',
  roles: ['collaborator'],
  scopes: [
    'dml.goal.write', 'dml.goal.control', 'dml.goal.read',
    'dml.learning.write', 'dml.learning.read',
    'dml.skill.read', 'dml.skill.write', 'dml.capability.read',
    'dml.branch.read', 'dml.development.execute',
    'dml.result.read', 'dml.message.write', 'dml.task.execute', 'dml.task.read', 'dml.project.select', 'project.read',
  ],
};
const owner = {
  subject_id: 'subject:human:duhengjie', roles: ['owner'],
  scopes: [
    'dml.result.approve', 'dml.system.control', 'dml.goal.write', 'dml.goal.control', 'dml.goal.read',
    'dml.learning.write', 'dml.learning.read', 'dml.skill.read', 'dml.skill.write',
    'dml.branch.read', 'dml.development.execute', 'dml.result.read', 'dml.message.write',
    'dml.task.execute', 'dml.task.read', 'dml.project.select', 'project.read',
  ],
};

const plans = {
  'dml.goal.create': [
    { step_id: 'read-context', label: '读取当前项目与最近修改', status: 'waiting' },
    { step_id: 'inspect-problem', label: '检查问题与可能原因', status: 'waiting' },
    { step_id: 'run-tests', label: '运行验证测试', status: 'waiting' },
    { step_id: 'produce-result', label: '比较结果并生成修改', status: 'waiting' },
  ],
};

function taskError(error) {
  if (!error) return null;
  if (typeof error === 'string') return { code: 'TASK_ERROR', message: error };
  const message = typeof error.message === 'string' && error.message.trim()
    ? error.message.trim()
    : (() => { try { return JSON.stringify(error); } catch { return String(error); } })();
  return { code: error.code || 'TASK_ERROR', message };
}

function taskIdOf(task) {
  return task?.task_id || task?.contract?.task_id || null;
}

function taskProjectId(task) {
  return task?.contract?.project_id || 'project:vsr';
}

function recoverableFailedCandidateTest(task) {
  if (!task || task.status !== 'failed' || Number(task.recovery_attempts || 0) >= 1) return false;
  return (task.plan?.operations || []).some((operation) => operation.type === 'candidate.test' && operation.status === 'failed');
}

function taskIsRecoverable(task) {
  if (!task) return false;
  if (task.status === 'running' || task.status === 'queued') return true;
  if (task.status === 'paused' && task.error?.code === 'TASK_INTERRUPTED') return true;
  if (recoverableFailedCandidateTest(task)) return true;
  return (task.plan?.operations || []).some((operation) => operation.status === 'running');
}

function overlayActiveTask(state, task) {
  if (!task) return state;
  const taskId = taskIdOf(task);
  if (!taskId) return state;
  const projectId = taskProjectId(task);
  const operations = task.plan?.operations || [];
  const completed = operations.filter((operation) => operation.status === 'completed').length;
  const status = task.status === 'failed' ? 'blocked' : task.status === 'queued' ? 'running' : task.status;
  const steps = operations.map((operation) => ({
    step_id: operation.operation_id,
    label: operation.title || operation.type,
    status: operation.status === 'waiting_approval' ? 'waiting' : operation.status,
    error: taskError(operation.error),
    evidence: operation.evidence || [],
  }));
  const existing = state.goals?.[taskId] || {};
  const goal = {
    ...existing,
    goal_id: taskId,
    project_id: projectId,
    title: task.contract?.payload?.title || task.contract?.instruction || existing.title || '真实任务',
    instruction: task.contract?.instruction || existing.instruction || '',
    status: status || 'running',
    progress: {
      current: completed,
      total: operations.length || 1,
      label: `${completed}/${operations.length || 1} 步已完成`,
    },
    steps,
    created_at: task.contract?.created_at || existing.created_at,
    updated_at: task.updated_at || task.completed_at || existing.updated_at,
  };
  const goals = { ...(state.goals || {}), [taskId]: goal };
  const artifacts = Array.isArray(task.artifacts) && task.artifacts.length
    ? task.artifacts.map((artifact) => ({ ...artifact, goal_id: taskId }))
    : state.artifacts || [];
  const files = Array.isArray(task.changed_files) && task.changed_files.length
    ? task.changed_files.map((file) => ({ path: typeof file === 'string' ? file : file.path, project_id: projectId, status: 'modified' }))
    : state.files || [];
  return {
    ...state,
    goals,
    active_goal_id: taskId,
    active_goal: goal,
    artifacts,
    files,
    right_context: {
      ...(state.right_context || {}),
      task: goal,
      files: files.filter((file) => !file.project_id || file.project_id === projectId),
      artifacts: artifacts.filter((artifact) => !artifact.goal_id || artifact.goal_id === taskId),
      pending_approval: (state.approvals || []).find((approval) => approval.goal_id === taskId && approval.status === 'pending') || null,
    },
  };
}

export class DMLRuntime {
  constructor({ stateDir = 'state', subject = defaultSubject, humanPrincipal = owner, projectPath = process.env.DML_DEFAULT_PROJECT_PATH || process.cwd() } = {}) {
    this.store = new EventStore(stateDir);
    this.subject = clone(subject);
    this.humanPrincipal = clone(humanPrincipal);
    this.provider = buildDMLProvider();
    this.projectPath = resolveUnifiedProjectPath(projectPath);
    this.capability = new CapabilityClosure({ stateDir: this.store.root, projectPath: this.projectPath });
    this.listeners = new Set();
    this.taskBusy = false;
    this.taskPauseRequested = false;
    this.taskHistory = [];
    this.recoveryPending = false;
    this.activeTask = loadInterruptedTask(this.store.root);
    if (this.activeTask && (this.activeTask.status === 'running' || (this.activeTask.plan?.operations || []).some((operation) => operation.status === 'running'))) {
      this.activeTask.status = 'paused';
      this.activeTask.error = { code: 'TASK_INTERRUPTED', message: '上次任务在进程退出时仍在运行，已保存现场并准备自动继续。', occurred_at: new Date().toISOString() };
      for (const operation of this.activeTask.plan?.operations || []) {
        if (operation.status === 'running') operation.status = 'waiting';
      }
      this.recoveryPending = true;
      persistTaskState(this.store.root, this.activeTask);
    } else if (this.activeTask?.status === 'paused' && this.activeTask.error?.code === 'TASK_INTERRUPTED') {
      this.recoveryPending = true;
    }
    const baseProjection = projectEvents(this.store.readEvents(), this.subject.subject_id);
    this.capability.scan({ projectPath: this.projectPath, projection: baseProjection });
    const restoredGoal = baseProjection.state.active_goal?.instruction || baseProjection.state.active_goal?.title || '继续升级 VSR 的光照系统，优先解决阴影抖动。';
    this.capability.buildPlan(restoredGoal, { projection: baseProjection });
    this.pendingLegacyGoal = null;
    const legacyGoal = baseProjection.state.active_goal;
    if (!this.activeTask && legacyGoal && ['running', 'blocked'].includes(legacyGoal.status)) {
      const pendingApproval = baseProjection.state.approvals.find((item) => item.goal_id === legacyGoal.goal_id && item.status === 'pending');
      const legacyArtifacts = baseProjection.state.artifacts.filter((item) => item.goal_id === legacyGoal.goal_id && item.status !== 'failed');
      if (pendingApproval && legacyArtifacts.length > 0) {
        this.event({
          type: 'plan.created', project_id: legacyGoal.project_id, goal_id: legacyGoal.goal_id, message: '旧版任务计划已迁移',
          data: { steps: [
            { step_id: 'read-context', label: '读取 VSR 当前源码与测试', status: 'completed' },
            { step_id: 'learn', label: '建立学习计划与知识声明', status: 'completed' },
            { step_id: 'branch', label: '创建两个候选现实分支', status: 'completed' },
            { step_id: 'tests', label: '执行 24 组稳定性矩阵与完整测试', status: 'completed' },
            { step_id: 'compare', label: '比较候选结果并生成产物', status: 'completed' },
            { step_id: 'record', label: '记录经验与技能候选', status: 'completed' },
            { step_id: 'approval', label: '等待所有者批准并采用', status: 'waiting' },
          ] },
        });
        this.event({ type: 'goal.status.changed', project_id: legacyGoal.project_id, goal_id: legacyGoal.goal_id, message: '候选结果已完成，等待批准', data: { status: 'waiting_approval' } });
        this.event({ type: 'message.added', project_id: legacyGoal.project_id, goal_id: legacyGoal.goal_id, message: '检测到旧版流程已经生成并验证候选结果。状态已修复为“等待批准”，请到产物页选择采用。', data: { role: 'assistant' } });
      } else {
        this.pendingLegacyGoal = {
          goal_id: legacyGoal.goal_id,
          project_id: legacyGoal.project_id || 'project:vsr',
          title: legacyGoal.title || restoredGoal,
          instruction: legacyGoal.instruction || legacyGoal.title || restoredGoal,
        };
      }
    }
  }

  health() {
    const events = this.store.readEvents();
    const registry = this.capability.registry;
    return {
      status: 'ok', protocol: 'dml.runtime.v0.4', runtime_version: '0.4.2-hotfix.2',
      event_count: events.length, projection_sequence: events.at(-1)?.sequence || 0,
      capability_registry: registry?.format || null,
      capability_ready: Boolean(this.capability.plan?.executable),
      capability_available: registry?.available_count || 0,
      capability_unavailable: registry?.unavailable_count || 0,
      capability_gaps: this.capability.gaps,
      task_status: this.activeTask?.status || null, task_id: this.activeTask?.task_id || null, task_busy: this.taskBusy,
      functions: ['describe', 'compileIntent', 'execute', 'executeAsync', 'project', 'readEvents', 'demo', 'scanCapabilities', 'retryBlockedGoal', 'runTask', 'resumeTask'],
    };
  }

  async resumePendingWork() {
    if (this.activeTask && !this.taskBusy && (this.recoveryPending || taskIsRecoverable(this.activeTask))) {
      this.recoveryPending = false;
      if (recoverableFailedCandidateTest(this.activeTask)) {
        this.activeTask.recovery_attempts = Number(this.activeTask.recovery_attempts || 0) + 1;
        this.activeTask.recovery_reason = 'candidate-test-failed-before-v0.4.2';
        this.activeTask.updated_at = new Date().toISOString();
        persistTaskState(this.store.root, this.activeTask);
      }
      const taskId = taskIdOf(this.activeTask);
      const projectId = taskProjectId(this.activeTask);
      return this.resumeTask({
        type: 'dml.goal.resume',
        action_id: id('action:restart-recovery', { task_id: taskId, at: new Date().toISOString() }),
        project_ref: { project_id: projectId },
        payload: { instruction: '恢复中断任务', project_path: this.activeTask.contract?.project_path || this.projectPath, restart_recovery: true },
      }, {});
    }
    const legacy = this.pendingLegacyGoal;
    if (!legacy || this.taskBusy || this.activeTask) return null;
    this.pendingLegacyGoal = null;
    this.event({ type: 'goal.status.changed', project_id: legacy.project_id, goal_id: legacy.goal_id, message: '旧版任务迁移到真实执行内核', data: { status: 'paused' } });
    this.event({ type: 'message.added', project_id: legacy.project_id, goal_id: legacy.goal_id, message: '旧版任务没有可恢复的操作记录，已迁移到 v0.4.2 真实任务队列并从安全候选现实重新执行。', data: { role: 'assistant' } });
    return this.runTask({
      type: 'dml.task.execute',
      action_id: id('action:legacy-task-migration', { goal_id: legacy.goal_id, at: new Date().toISOString() }),
      project_ref: { project_id: legacy.project_id },
      payload: {
        title: legacy.title,
        instruction: legacy.instruction,
        project_path: this.projectPath,
        migrated_from_goal_id: legacy.goal_id,
      },
    }, {});
  }

  describe() { return clone(this.provider); }

  compileIntent(rawAction, host = {}) {
    const action = normalizeSemanticAction({ subject: this.subject, human_principal: this.humanPrincipal, ...rawAction });
    const request = semanticActionToCNPRequest(action, host);
    const negotiation = negotiate({ request, providers: [this.provider] });
    const envelope = buildProposedEnvelope({ action, negotiation, projectId: action.project_ref?.project_id || 'project:unknown', goalId: action.goal_ref });
    const authority = decideAuthority({ action, negotiation, envelope });
    return { action, request, negotiation, envelope, authority: authoritySummary(authority) };
  }

  project() {
    const base = projectEvents(this.store.readEvents(), this.subject.subject_id);
    const capabilityState = this.capability.projectionState();
    const taskState = overlayActiveTask({ ...base.state, ...capabilityState }, this.activeTask);
    const projection = normalizeProjection({
      ...base,
      format: 'dml.workbench-projection.v0.4',
      state: {
        ...taskState,
        system: {
          ...(taskState.system || {}),
          runtime_version: '0.4.2-hotfix.2',
          capability_ready: Boolean(this.capability.plan?.executable),
          capability_gaps: this.capability.gaps.length,
          task_busy: this.taskBusy,
          task_pause_requested: this.taskPauseRequested,
        },
        active_task: this.activeTask ? clone(this.activeTask) : null,
        task_history: clone(this.taskHistory),
        task_results: this.activeTask?.result ? [clone(this.activeTask.result)] : [],
      },
    });
    this.store.saveProjection(projection);
    return projection;
  }

  readEvents() { return this.store.readEvents(); }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  event(base) {
    const event = this.store.append({ subject_id: this.subject.subject_id, ...base });
    const projection = this.project();
    for (const listener of this.listeners) listener(projection, event);
    return event;
  }

  prepare(rawAction, options = {}) {
    const action = normalizeSemanticAction({ subject: this.subject, human_principal: this.humanPrincipal, ...rawAction });
    const request = semanticActionToCNPRequest(action, options.host || {});
    const negotiation = negotiate({ request, providers: [this.provider] });
    if (negotiation.plan.status !== 'satisfied') throw new DMLError('CAPABILITY_UNSATISFIED', JSON.stringify(negotiation.plan.unresolved_goals));
    const envelope = buildProposedEnvelope({ action, negotiation, projectId: action.project_ref?.project_id || 'project:unknown', goalId: action.goal_ref });
    const decision = decideAuthority({ action, negotiation, envelope, approval: options.approval || null });
    return { action, request, negotiation, envelope, decision, options };
  }

  authorityGate(prepared) {
    const { action, negotiation, decision, envelope } = prepared;
    if (decision.status === 'denied') {
      return { status: 'denied', action, negotiation, authority: authoritySummary(decision), projection: this.project() };
    }
    if (decision.status === 'pending_approval') {
      const approvalId = id('approval-request', envelope.proposal_root);
      this.event({
        type: 'approval.requested', project_id: action.project_ref?.project_id, goal_id: action.goal_ref,
        status: 'pending', message: action.type === 'dml.result.approve' ? '是否采用这个结果？' : '是否允许执行这项高风险行动？',
        data: { approval_id: approvalId, artifact_id: action.payload.artifact_id || null, proposal_root: envelope.proposal_root, action_type: action.type },
        caused_by: action.action_id,
      });
      return { status: 'pending_approval', action, negotiation, authority: authoritySummary(decision), projection: this.project() };
    }
    return null;
  }

  execute(rawAction, options = {}) {
    const prepared = this.prepare(rawAction, options);
    const gate = this.authorityGate(prepared);
    if (gate) return gate;
    const { action, negotiation, decision } = prepared;
    if (['dml.development.run', 'dml.skill.transfer.verify', 'dml.task.execute'].includes(action.type)) {
      throw new DMLError('ASYNC_ACTION_REQUIRED', action.type);
    }
    if (action.type === 'dml.result.approve') {
      const artifact = this.project().state.artifacts.find((item) => item.artifact_id === action.payload.artifact_id);
      if (artifact?.branch_path) throw new DMLError('ASYNC_ACTION_REQUIRED', 'branch adoption requires executeAsync');
    }
    const result = this.executeAuthorized(action, { negotiation, authority: decision, options });
    return { status: 'executed', action, negotiation, authority: authoritySummary(decision), result, projection: this.project() };
  }

  async executeAsync(rawAction, options = {}) {
    const prepared = this.prepare(rawAction, options);
    const gate = this.authorityGate(prepared);
    if (gate) return gate;
    const { action, negotiation, decision } = prepared;
    let result;
    const instruction = this.taskInstruction(action).trim();
    const continuation = /^(继续当前任务|继续任务|恢复任务|重试任务|resume|retry)$/i.test(instruction);
    if (action.type === 'dml.message.send' && continuation) {
      if (this.activeTask?.status === 'waiting_approval') {
        this.event({ type: 'message.added', project_id: this.activeTask.contract.project_id, goal_id: this.activeTask.task_id, message: '候选结果已经完成验证，下一步需要你在产物页明确采用或拒绝。', data: { role: 'assistant' }, caused_by: action.action_id });
        result = { task: clone(this.activeTask), result: this.activeTask.result || createTaskResult(this.activeTask) };
      } else if (this.activeTask && ['failed', 'paused', 'blocked'].includes(this.activeTask.status)) {
        result = await this.resumeTask(action, options);
      } else if (this.activeTask) {
        result = { task: clone(this.activeTask), result: this.activeTask.result || createTaskResult(this.activeTask) };
      } else if (this.pendingLegacyGoal) {
        result = await this.resumePendingWork();
      }
    }
    if (result !== undefined) return { status: 'executed', action, negotiation, authority: authoritySummary(decision), result, projection: this.project() };
    if (action.type === 'dml.development.run') {
      const task = action.payload.task || action.payload.instruction || '';
      const specialized = action.payload.mode === 'specialized-vsr-shadow' || (/VSR/i.test(task) && /阴影|shadow/i.test(task));
      result = specialized ? await this.runDevelopmentWithCapabilities(action) : await this.runTask(action, options);
    }
    else if (action.type === 'dml.task.execute' || action.type === 'dml.message.send' || action.type === 'dml.goal.create') result = await this.runTask(action, options);
    else if (action.type === 'dml.goal.retry') result = this.activeTask && ['failed', 'paused', 'blocked', 'waiting_approval'].includes(this.activeTask.status) ? await this.resumeTask(action, options) : await this.retryBlockedGoal(action);
    else if (action.type === 'dml.goal.resume' && this.activeTask?.status === 'paused') result = await this.resumeTask(action, options);
    else if (action.type === 'dml.result.approve') result = this.activeTask?.status === 'waiting_approval' ? await this.resumeTask(action, options) : await this.approveResultAsync(action, decision);
    else if (action.type === 'dml.result.reject' && this.activeTask?.status === 'waiting_approval') result = await this.rejectTask(action);
    else if (action.type === 'dml.skill.transfer.verify') result = await this.verifySkillTransfer(action);
    else result = this.executeAuthorized(action, { negotiation, authority: decision, options });
    return { status: 'executed', action, negotiation, authority: authoritySummary(decision), result, projection: this.project() };
  }

  taskInstruction(action) {
    return action.payload?.instruction || action.payload?.task || action.payload?.title || action.payload?.text || '';
  }

  taskProjectPath(action) {
    return resolveUnifiedProjectPath(action.payload?.project_path || this.projectPath || this.capability.projectPath || process.cwd());
  }

  emitTaskProgress(kind, operation, outcome, action, goalId) {
    const projectId = action.project_ref?.project_id || 'project:vsr';
    if (kind === 'started') {
      this.event({ type: 'step.started', project_id: projectId, goal_id: goalId, message: operation.title || operation.type, data: { step_id: operation.operation_id, label: operation.title || operation.type }, caused_by: action.action_id });
      return;
    }
    if (kind === 'failed') {
      this.event({ type: 'step.failed', project_id: projectId, goal_id: goalId, message: outcome.error?.message || '任务操作失败', data: { step_id: operation.operation_id, label: operation.title || operation.type, error: outcome.error }, caused_by: action.action_id });
      return;
    }
    if (kind === 'approval') {
      const artifact = outcome.artifact || this.activeTask?.artifacts?.[0] || null;
      this.event({ type: 'approval.requested', project_id: projectId, goal_id: goalId, message: operation.type === 'candidate.adopt' ? '候选结果已验证，是否采用到正式项目？' : `是否允许执行：${operation.title || operation.type}？`, data: { approval_id: id('approval-request', { task: goalId, operation: operation.operation_id }), artifact_id: artifact?.artifact_id || null, operation_id: operation.operation_id, action_type: action.type, proposal_root: hash({ task: goalId, operation: operation.operation_id }) }, caused_by: action.action_id });
      return;
    }
    if (kind === 'completed') {
      this.event({ type: 'step.completed', project_id: projectId, goal_id: goalId, message: `${operation.title || operation.type}完成`, data: { step_id: operation.operation_id, label: operation.title || operation.type }, evidence: (outcome.evidence || []).map((value) => ({ kind: 'task-evidence', value })), caused_by: action.action_id });
      if (Array.isArray(outcome.changed_files)) {
        for (const file of outcome.changed_files) {
          const absolute = path.join(this.taskProjectPath(action), file);
          this.event({ type: 'file.changed', project_id: projectId, goal_id: goalId, message: file, data: { path: file, kind: 'modified', root: fs.existsSync(absolute) && fs.statSync(absolute).isFile() ? hash([...fs.readFileSync(absolute)]) : null }, caused_by: action.action_id });
        }
      }
      if (Array.isArray(outcome.artifacts)) {
        for (const artifact of outcome.artifacts) this.event({ type: 'artifact.produced', project_id: projectId, goal_id: goalId, message: artifact.title, data: artifact, caused_by: action.action_id });
      }
      if (operation.type === 'candidate.create' && outcome.candidates?.[0]) {
        const branch = outcome.candidates[0];
        this.event({ type: 'branch.created', project_id: projectId, goal_id: goalId, message: branch.label, data: branch, caused_by: action.action_id });
      }
      if (operation.type === 'candidate.modify' && outcome.candidates?.[0]) {
        const branch = outcome.candidates[0];
        this.event({ type: 'branch.changed', project_id: projectId, goal_id: goalId, message: `${branch.changed_files?.length || 0} 个文件已修改`, data: branch, caused_by: action.action_id });
      }
      if (operation.type === 'candidate.test' && outcome.candidates?.[0]) {
        for (const branch of outcome.candidates) this.event({ type: 'branch.tested', project_id: projectId, goal_id: goalId, message: `${branch.label || branch.branch_id}测试通过`, data: branch, caused_by: action.action_id });
      }
      if (operation.type === 'candidate.adopt' && outcome.output?.receipt) {
        this.event({ type: 'branch.committed', project_id: projectId, goal_id: goalId, message: '候选现实已合并', data: outcome.output.receipt, caused_by: action.action_id });
      }
    }
  }

  async runTask(action, options = {}) {
    if (this.taskBusy || (this.activeTask && ['queued', 'running', 'paused', 'waiting_approval'].includes(this.activeTask.status))) throw new DMLError('TASK_ALREADY_RUNNING', '当前已有任务正在执行或等待决定');
    const instruction = this.taskInstruction(action);
    if (!instruction) throw new DMLError('TASK_INSTRUCTION_REQUIRED', '任务内容不能为空');
    const projectPath = this.taskProjectPath(action);
    if (!fs.existsSync(projectPath)) throw new DMLError('PROJECT_PATH_REQUIRED', projectPath);
    const projection = projectEvents(this.store.readEvents(), this.subject.subject_id);
    const registry = this.capability.scan({ projectPath, projection });
    const contract = createTaskContract({ action: { ...action, payload: { ...action.payload, project_path: projectPath } }, projectPath, instruction });
    const plan = planTask(contract, registry);
    const state = createTaskState(contract, plan);
    this.activeTask = state;
    this.taskBusy = true;
    this.taskPauseRequested = false;
    const goalId = contract.task_id;
    const projectId = contract.project_id;
    this.event({ type: 'goal.created', project_id: projectId, goal_id: goalId, message: action.payload?.title || instruction.slice(0, 80), data: { title: action.payload?.title || instruction.slice(0, 80), instruction }, caused_by: action.action_id });
    this.event({ type: 'message.added', project_id: projectId, goal_id: goalId, message: instruction, data: { role: 'user' }, caused_by: action.action_id });
    this.event({ type: 'message.added', project_id: projectId, goal_id: goalId, message: `已转换为 ${plan.operations.length} 个真实操作，开始执行。`, data: { role: 'assistant' }, caused_by: action.action_id });
    this.event({ type: 'plan.created', project_id: projectId, goal_id: goalId, message: '真实任务计划已建立', data: { steps: taskPlanSteps(state) }, caused_by: action.action_id });
    const executor = new TaskExecutor({ stateDir: this.store.root, projectPath });
    try {
      const execution = await executor.execute({ state, approval: options.approval || null, selectedCandidateId: action.payload?.candidate_id || null, shouldPause: () => this.taskPauseRequested, emit: (kind, operation, outcome) => this.emitTaskProgress(kind, operation, outcome, action, goalId) });
      this.activeTask = execution.state;
      this.activeTask.result = execution.result;
      if (execution.state.status === 'completed') {
        this.event({ type: 'transition.committed', project_id: projectId, goal_id: goalId, message: '任务已真实执行并验证完成', data: { task_id: goalId, result_root: execution.result.result_root, changed_files: execution.state.changed_files }, caused_by: action.action_id });
        this.event({ type: 'message.added', project_id: projectId, goal_id: goalId, message: `任务完成：${execution.result.operations_completed}/${execution.result.operations_total} 个操作已执行。`, data: { role: 'assistant' }, caused_by: action.action_id });
        this.taskHistory.push({ task_id: goalId, instruction, status: 'completed', result_root: execution.result.result_root, completed_at: execution.result.completed_at });
      } else if (execution.state.status === 'waiting_approval') {
        this.event({ type: 'goal.status.changed', project_id: projectId, goal_id: goalId, message: '候选结果已验证，等待所有者批准', data: { status: 'waiting_approval' }, caused_by: action.action_id });
        this.event({ type: 'message.added', project_id: projectId, goal_id: goalId, message: '真实修改和测试已经完成。任务没有卡住，目前正在等待你到产物页选择采用。', data: { role: 'assistant' }, caused_by: action.action_id });
      } else if (execution.state.status === 'paused') {
        this.event({ type: 'goal.status.changed', project_id: projectId, goal_id: goalId, message: '任务已安全暂停', data: { status: 'paused' }, caused_by: action.action_id });
      } else if (execution.state.status === 'failed') {
        this.event({ type: 'goal.status.changed', project_id: projectId, goal_id: goalId, message: '真实执行失败', data: { status: 'blocked' }, caused_by: action.action_id });
        this.event({ type: 'message.added', project_id: projectId, goal_id: goalId, message: `真实执行失败：${execution.state.error?.message || '未知错误'}`, data: { role: 'assistant' }, caused_by: action.action_id });
      }
      return { task: clone(execution.state), result: execution.result };
    } finally {
      this.taskBusy = false;
    }
  }

  async resumeTask(action, options = {}) {
    if (!this.activeTask) throw new DMLError('ACTIVE_TASK_NOT_FOUND', '当前没有可继续的任务');
    if (this.taskBusy) throw new DMLError('TASK_ALREADY_RUNNING', '任务仍在执行');
    const projectPath = resolveUnifiedProjectPath(this.activeTask.contract.project_path);
    const executor = new TaskExecutor({ stateDir: this.store.root, projectPath });
    this.taskBusy = true;
    this.taskPauseRequested = false;
    const goalId = this.activeTask.task_id;
    const projectId = this.activeTask.contract.project_id;
    const pendingApproval = this.project().state.approvals.find((item) => item.goal_id === goalId && item.status === 'pending');
    if (pendingApproval && options.approval?.decision === 'approved') this.event({ type: 'approval.resolved', project_id: projectId, goal_id: goalId, message: '任务操作已批准', data: { approval_id: pendingApproval.approval_id, decision: 'approved' }, caused_by: action.action_id });
    try {
      for (const operation of this.activeTask.plan.operations) {
        if (operation.status === 'failed' || operation.status === 'running') operation.status = 'waiting';
        if (operation.status !== 'completed' && operation.status !== 'waiting_approval') delete operation.error;
      }
      this.activeTask.status = 'queued';
      this.activeTask.error = null;
      this.activeTask.updated_at = new Date().toISOString();
      persistTaskState(this.store.root, this.activeTask);
      this.event({ type: 'goal.status.changed', project_id: projectId, goal_id: goalId, message: '恢复真实任务执行', data: { status: 'running' }, caused_by: action.action_id });
      const execution = await executor.execute({ state: this.activeTask, approval: options.approval || null, selectedCandidateId: action.payload?.candidate_id || action.payload?.branch_id || null, shouldPause: () => this.taskPauseRequested, emit: (kind, operation, outcome) => this.emitTaskProgress(kind, operation, outcome, action, goalId) });
      this.activeTask = execution.state;
      this.activeTask.result = execution.result;
      if (execution.state.status === 'completed') {
        this.event({ type: 'transition.committed', project_id: projectId, goal_id: goalId, message: '任务已真实执行并验证完成', data: { task_id: goalId, result_root: execution.result.result_root, changed_files: execution.state.changed_files }, caused_by: action.action_id });
        this.event({ type: 'message.added', project_id: projectId, goal_id: goalId, message: '已采用并完成任务。', data: { role: 'assistant' }, caused_by: action.action_id });
        this.taskHistory.push({ task_id: goalId, instruction: this.activeTask.contract.instruction, status: 'completed', result_root: execution.result.result_root, completed_at: execution.result.completed_at });
      } else if (execution.state.status === 'waiting_approval') {
        this.event({ type: 'goal.status.changed', project_id: projectId, goal_id: goalId, message: '等待所有者批准', data: { status: 'waiting_approval' }, caused_by: action.action_id });
      } else if (execution.state.status === 'paused') {
        this.event({ type: 'goal.status.changed', project_id: projectId, goal_id: goalId, message: '任务已安全暂停', data: { status: 'paused' }, caused_by: action.action_id });
      } else if (execution.state.status === 'failed') {
        this.event({ type: 'goal.status.changed', project_id: projectId, goal_id: goalId, message: '任务恢复后仍然失败', data: { status: 'blocked' }, caused_by: action.action_id });
        this.event({ type: 'message.added', project_id: projectId, goal_id: goalId, message: `继续执行失败：${execution.state.error?.message || '未知错误'}`, data: { role: 'assistant' }, caused_by: action.action_id });
      }
      return { task: clone(execution.state), result: execution.result };
    } finally {
      this.taskBusy = false;
    }
  }

  async rejectTask(action) {
    if (!this.activeTask) throw new DMLError('ACTIVE_TASK_NOT_FOUND', '当前没有等待决定的任务');
    const goalId = this.activeTask.task_id;
    const projectId = this.activeTask.contract.project_id;
    const approval = this.project().state.approvals.find((item) => item.goal_id === goalId && item.status === 'pending');
    if (approval) this.event({ type: 'approval.resolved', project_id: projectId, goal_id: goalId, message: '任务结果未采用', data: { approval_id: approval.approval_id, decision: 'rejected' }, caused_by: action.action_id });
    this.activeTask.status = 'rejected';
    this.activeTask.error = { code: 'TASK_REJECTED', message: action.payload?.reason || '所有者拒绝了待批准操作', occurred_at: new Date().toISOString() };
    this.activeTask.result = createTaskResult(this.activeTask);
    this.event({ type: 'goal.status.changed', project_id: projectId, goal_id: goalId, message: '任务已拒绝', data: { status: 'paused' }, caused_by: action.action_id });
    this.event({ type: 'message.added', project_id: projectId, goal_id: goalId, message: '已保留候选产物，但没有修改正式项目。', data: { role: 'assistant' }, caused_by: action.action_id });
    return { task: clone(this.activeTask), result: this.activeTask.result };
  }

  scanCapabilities({ projectPath = null, goal = null } = {}) {
    const target = resolveUnifiedProjectPath(projectPath || this.capability.projectPath || process.env.DML_DEFAULT_PROJECT_PATH || process.cwd());
    const projection = projectEvents(this.store.readEvents(), this.subject.subject_id);
    const registry = this.capability.scan({ projectPath: target, projection });
    const activeGoal = goal || projection.state.active_goal?.instruction || projection.state.active_goal?.title || '继续升级 VSR 的光照系统，优先解决阴影抖动。';
    this.capability.buildPlan(activeGoal, { projection });
    this.event({
      type: 'capability.scanned',
      project_id: 'project:vsr',
      message: `能力扫描完成：${registry.available_count} 可用，${registry.unavailable_count} 不可用`,
      data: { registry_root: registry.registry_root, available_count: registry.available_count, unavailable_count: registry.unavailable_count },
    });
    return registry;
  }

  async runDevelopmentWithCapabilities(action) {
    const projectPath = resolveUnifiedProjectPath(action.payload.project_path || process.env.DML_DEFAULT_PROJECT_PATH || this.capability.projectPath);
    const goal = action.payload.task || action.payload.title || action.payload.instruction || '未命名开发任务';
    const projection = projectEvents(this.store.readEvents(), this.subject.subject_id);
    this.capability.scan({ projectPath, projection });
    const plan = this.capability.buildPlan(goal, { projection });
    this.event({ type: 'capability.plan.created', project_id: action.project_ref?.project_id || 'project:vsr', goal_id: action.goal_ref, message: plan.executable ? '能力计划可执行' : `发现 ${plan.missing_capabilities.length} 个能力缺口`, data: plan, caused_by: action.action_id });
    if (!plan.executable) {
      this.capability.blockedAction = clone(action);
      this.capability.save();
      for (const gap of this.capability.gaps) this.event({ type: 'capability.gap.detected', project_id: action.project_ref?.project_id || 'project:vsr', goal_id: action.goal_ref, message: `${gap.capability_id}：${gap.reason}`, data: gap, caused_by: action.action_id });
      this.event({ type: 'capability.goal.blocked', project_id: action.project_ref?.project_id || 'project:vsr', goal_id: action.goal_ref, message: '任务因能力缺口暂停', data: { gaps: this.capability.gaps }, caused_by: action.action_id });
      throw new DMLError('CAPABILITY_GAP', this.capability.gaps.map((gap) => `${gap.capability_id}: ${gap.reason}`).join('；'));
    }

    const maxAttempts = Math.max(1, Number(process.env.DML_PROVIDER_ATTEMPTS || 2));
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const startedAt = new Date().toISOString();
      try {
        const value = await runVSRShadowDevelopmentLoop(this, { ...action, payload: { ...action.payload, project_path: projectPath } });
        this.capability.recordAttempt({ actionType: action.type, status: 'passed', startedAt });
        this.capability.blockedAction = null;
        this.capability.save();
        return value;
      } catch (error) {
        lastError = error;
        const diagnosis = this.capability.diagnose(error, 'development.run');
        this.capability.recordAttempt({ actionType: action.type, status: 'failed', error, diagnosis, startedAt });
        this.event({ type: 'capability.provider.failed', project_id: action.project_ref?.project_id || 'project:vsr', goal_id: action.goal_ref, message: diagnosis.message, data: { attempt, diagnosis }, caused_by: action.action_id });
        if (!diagnosis.retryable || attempt >= maxAttempts) break;
        const replan = this.capability.recordReplan({ actionType: action.type, diagnosis, action: 'retry-isolated-development-loop' });
        this.event({ type: 'capability.plan.revised', project_id: action.project_ref?.project_id || 'project:vsr', goal_id: action.goal_ref, message: `临时故障，准备第 ${attempt + 1} 次尝试`, data: replan, caused_by: action.action_id });
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
    }
    const diagnosis = this.capability.diagnose(lastError, 'development.run');
    if (diagnosis.kind === 'capability-gap' || diagnosis.kind === 'authority') {
      this.capability.blockedAction = clone(action);
      this.capability.save();
      this.event({ type: 'capability.goal.blocked', project_id: action.project_ref?.project_id || 'project:vsr', goal_id: action.goal_ref, message: diagnosis.message, data: { diagnosis }, caused_by: action.action_id });
    }
    throw lastError;
  }

  async retryBlockedGoal(action) {
    const blocked = this.capability.blockedAction;
    if (!blocked) throw new DMLError('BLOCKED_ACTION_NOT_FOUND', '当前没有等待补齐能力的任务');
    const projectPath = resolveUnifiedProjectPath(blocked.payload?.project_path || this.capability.projectPath);
    const goal = blocked.payload?.task || blocked.payload?.title || blocked.payload?.instruction || '未命名开发任务';
    const projection = projectEvents(this.store.readEvents(), this.subject.subject_id);
    this.capability.scan({ projectPath, projection });
    const plan = this.capability.buildPlan(goal, { projection });
    if (!plan.executable) throw new DMLError('CAPABILITY_GAP_REMAINS', this.capability.gaps.map((gap) => `${gap.capability_id}: ${gap.reason}`).join('；'));
    this.event({ type: 'capability.goal.resumed', project_id: blocked.project_ref?.project_id || 'project:vsr', goal_id: blocked.goal_ref, message: '能力缺口已解除，继续执行任务', data: { resumed_by: action.action_id } });
    this.capability.blockedAction = null;
    this.capability.save();
    return this.runDevelopmentWithCapabilities(blocked);
  }

  executeAuthorized(action, context) {
    const projectId = action.project_ref?.project_id || 'project:vsr';
    const goalId = action.goal_ref || action.payload.goal_id || null;
    switch (action.type) {
      case 'dml.capability.scan': {
        const registry = this.scanCapabilities({ projectPath: action.payload.project_path || this.capability.projectPath, goal: action.payload.goal || null });
        return registry;
      }
      case 'dml.capability.inspect': return this.capability.projectionState();
      case 'dml.message.send':
        return this.event({ type: 'message.added', project_id: projectId, goal_id: goalId, message: action.payload.text || '', data: { role: action.payload.role || 'user' }, caused_by: action.action_id });
      case 'dml.project.select':
        return this.event({ type: 'project.selected', project_id: action.payload.project_id, message: '已切换项目', caused_by: action.action_id });
      case 'dml.goal.create': {
        const newGoalId = action.payload.goal_id || id('goal', { action: action.action_root, project: projectId });
        const title = action.payload.title || '新任务';
        const instruction = action.payload.instruction || title;
        const created = this.event({ type: 'goal.created', project_id: projectId, goal_id: newGoalId, message: title, data: { title, instruction }, caused_by: action.action_id });
        this.event({ type: 'message.added', project_id: projectId, goal_id: newGoalId, message: instruction, data: { role: 'user' }, caused_by: action.action_id });
        this.event({ type: 'message.added', project_id: projectId, goal_id: newGoalId, message: '我先读取当前项目，再学习缺失知识、建立候选分支并运行验证。', data: { role: 'assistant' }, caused_by: action.action_id });
        this.event({ type: 'plan.created', project_id: projectId, goal_id: newGoalId, message: '任务计划已建立', data: { steps: plans['dml.goal.create'] }, caused_by: action.action_id });
        return created;
      }
      case 'dml.goal.pause': this.taskPauseRequested = true; return this.event({ type: 'goal.status.changed', project_id: projectId, goal_id: goalId, message: '任务已暂停', data: { status: 'paused' }, caused_by: action.action_id });
      case 'dml.goal.resume': this.taskPauseRequested = false; return this.event({ type: 'goal.status.changed', project_id: projectId, goal_id: goalId, message: '任务已继续', data: { status: 'running' }, caused_by: action.action_id });
      case 'dml.learning.start': {
        const learningId = id('learning', action.action_root);
        this.event({ type: 'learning.started', project_id: projectId, goal_id: goalId, message: `开始学习：${action.payload.topic}`, data: { learning_id: learningId, topic: action.payload.topic, status: '正在理解', understanding: '正在比较来源并建立结构', next_step: '设计最小实验' }, caused_by: action.action_id });
        return { learning_id: learningId };
      }
      case 'dml.project.inspect': {
        const snapshot = inspectProject(action.payload.path, action.payload.limit || 500);
        for (const file of snapshot.files.slice(0, 100)) this.event({ type: 'file.observed', project_id: projectId, goal_id: goalId, message: file.path, data: file, evidence: [{ kind: 'file-root', root: file.root }], caused_by: action.action_id });
        const artifactId = id('artifact:project-snapshot', snapshot.snapshot_root);
        this.event({ type: 'artifact.produced', project_id: projectId, goal_id: goalId, message: '项目快照已生成', data: { artifact_id: artifactId, title: '项目结构快照', summary: `${snapshot.file_count} 个文件`, status: 'candidate', root: snapshot.snapshot_root }, caused_by: action.action_id });
        return { ...snapshot, artifact_id: artifactId };
      }
      case 'dml.result.preview': return { artifacts: this.project().state.right_context.artifacts };
      case 'dml.result.alternate': return this.event({ type: 'message.added', project_id: projectId, goal_id: goalId, message: '我会保留当前结果，并尝试另一条路线。', data: { role: 'assistant' }, caused_by: action.action_id });
      case 'dml.result.reject': {
        const approval = this.project().state.approvals.find((item) => item.artifact_id === action.payload.artifact_id && item.status === 'pending');
        if (approval) this.event({ type: 'approval.resolved', project_id: projectId, goal_id: goalId, message: '结果未采用', data: { approval_id: approval.approval_id, decision: 'rejected' }, caused_by: action.action_id });
        return { rejected: action.payload.artifact_id };
      }
      case 'dml.result.approve': {
        const approval = this.project().state.approvals.find((item) => item.artifact_id === action.payload.artifact_id && item.status === 'pending');
        if (approval) this.event({ type: 'approval.resolved', project_id: projectId, goal_id: goalId, message: '结果已批准', data: { approval_id: approval.approval_id, decision: 'approved' }, caused_by: action.action_id });
        this.event({ type: 'transition.committed', project_id: projectId, goal_id: goalId, message: '结果已加入当前项目', data: { artifact_id: action.payload.artifact_id, generation: Number(action.payload.generation || 1), authority_decision_root: context.authority.decision_root }, caused_by: action.action_id });
        return { committed: true, artifact_id: action.payload.artifact_id };
      }
      case 'dml.branch.inspect': return { branches: this.project().state.branches };
      case 'dml.skill.form': return this.formSkillFromHypothesis({ hypothesisId: action.payload.hypothesis_id, goalId, projectId });
      case 'dml.system.pause': return this.event({ type: 'system.paused', message: '所有行动已暂停', caused_by: action.action_id });
      case 'dml.system.resume': return this.event({ type: 'system.resumed', message: '行动已恢复', caused_by: action.action_id });
      case 'dml.task.inspect': return this.activeTask || { status: 'idle' };
      case 'dml.goal.inspect': case 'dml.learning.inspect': case 'dml.skill.inspect': return this.project().state;
      default: throw new DMLError('EXECUTION_NOT_IMPLEMENTED', action.type);
    }
  }

  formSkillFromHypothesis({ hypothesisId, goalId, projectId }) {
    const state = this.project().state;
    const hypothesis = state.skill_hypotheses.find((item) => item.hypothesis_id === hypothesisId)
      || state.skill_hypotheses.filter((item) => !goalId || item.goal_id === goalId).at(-1);
    if (!hypothesis) throw new DMLError('SKILL_HYPOTHESIS_NOT_FOUND', String(hypothesisId || ''));
    const experiments = state.experiments.filter((item) => !goalId || item.goal_id === goalId);
    const capsule = createSkillCapsule({
      name: hypothesis.name,
      version: '0.2.0',
      applicability: hypothesis.trigger_conditions,
      procedure: hypothesis.procedure,
      validationCases: experiments.map((item) => ({ experiment_id: item.experiment_id, status: item.status, evidence_root: item.evidence_root })),
      failureBoundaries: ['真实 GPU 性能仍需设备矩阵复核', '仅适用于方向光阴影与正交阴影视锥'],
      evidenceRoots: [...(hypothesis.evidence_roots || []), ...experiments.map((item) => item.evidence_root).filter(Boolean)],
      level: '刚学会',
    });
    this.event({ type: 'skill.formed', project_id: projectId, goal_id: goalId, message: `技能已形成：${capsule.name}`, data: capsule, evidence: [{ kind: 'skill-root', root: capsule.evidence_root }] });
    return capsule;
  }

  async approveResultAsync(action, decision) {
    const projectId = action.project_ref?.project_id || 'project:vsr';
    const goalId = action.goal_ref || null;
    const state = this.project().state;
    const artifact = state.artifacts.find((item) => item.artifact_id === action.payload.artifact_id);
    if (!artifact) throw new DMLError('ARTIFACT_NOT_FOUND', action.payload.artifact_id);
    const completeSpecializedApprovalStep = () => {
      const goal = state.goals?.[goalId];
      if (goal?.steps?.some((step) => step.step_id === 'approval' && step.status !== 'completed')) {
        this.event({ type: 'step.completed', project_id: projectId, goal_id: goalId, message: '所有者批准并采用完成', data: { step_id: 'approval', label: '等待所有者批准并采用' }, caused_by: action.action_id });
      }
    };
    const approval = state.approvals.find((item) => item.artifact_id === artifact.artifact_id && item.status === 'pending');
    if (approval) this.event({ type: 'approval.resolved', project_id: projectId, goal_id: goalId, message: '结果已批准', data: { approval_id: approval.approval_id, decision: 'approved' }, caused_by: action.action_id });

    if (!artifact.branch_path || !artifact.source_path) {
      completeSpecializedApprovalStep();
      this.event({ type: 'transition.committed', project_id: projectId, goal_id: goalId, message: '结果已加入当前项目', data: { artifact_id: artifact.artifact_id, generation: 1, authority_decision_root: decision.decision_root }, caused_by: action.action_id });
      return { committed: true, artifact_id: artifact.artifact_id };
    }

    const branch = {
      branch_id: artifact.branch_id,
      branch_path: artifact.branch_path,
      source_path: artifact.source_path,
      project_id: projectId,
      label: artifact.title,
      strategy: artifact.strategy || {},
      base_root: artifact.base_root || null,
      reversible: true,
    };
    const receipt = commitRealityBranch({ branch, backupRoot: path.join(this.store.root, 'backups') });
    for (const change of receipt.committed) {
      const file = path.join(receipt.source_path, change.path);
      this.event({ type: 'file.changed', project_id: projectId, goal_id: goalId, message: change.path, data: { path: change.path, kind: change.kind, root: fs.existsSync(file) && fs.statSync(file).isFile() ? hash([...fs.readFileSync(file)]) : null }, evidence: [{ kind: 'commit-receipt', root: receipt.receipt_root }] });
    }
    this.event({ type: 'branch.committed', project_id: projectId, goal_id: goalId, message: `${artifact.title}已合并到正式项目`, data: receipt, evidence: [{ kind: 'commit-receipt', root: receipt.receipt_root }] });
    completeSpecializedApprovalStep();
    this.event({ type: 'transition.committed', project_id: projectId, goal_id: goalId, message: '候选分支已成为新的正式版本', data: { artifact_id: artifact.artifact_id, branch_id: artifact.branch_id, generation: Number(action.payload.generation || 1), authority_decision_root: decision.decision_root, receipt_root: receipt.receipt_root }, caused_by: action.action_id });

    const hypothesis = state.skill_hypotheses.filter((item) => item.goal_id === goalId).at(-1);
    const skill = this.formSkillFromHypothesis({ hypothesisId: hypothesis?.hypothesis_id, goalId, projectId });
    const transfer = await this.verifySkillTransfer({
      project_ref: { project_id: projectId }, goal_ref: goalId,
      payload: { skill_id: skill.skill_id, project_path: receipt.source_path, script: 'dml:shadow-transfer' },
      action_id: action.action_id,
    });
    return { committed: true, artifact_id: artifact.artifact_id, branch_receipt: receipt, skill, transfer };
  }

  async verifySkillTransfer(action) {
    const projectId = action.project_ref?.project_id || 'project:vsr';
    const goalId = action.goal_ref || null;
    const projectPath = resolveUnifiedProjectPath(action.payload.project_path || '');
    if (!projectPath || !fs.existsSync(projectPath)) throw new DMLError('PROJECT_PATH_REQUIRED', projectPath);
    const script = action.payload.script || 'dml:shadow-transfer';
    const receipt = await runProjectScript({ projectPath, script, timeoutMs: 240_000, evidenceDir: path.join(this.store.root, 'evidence') });
    const data = { skill_id: action.payload.skill_id, project_path: projectPath, scene: '斜向光源与远距离双簇场景', level: receipt.status === 'passed' ? '已验证' : '刚学会', ...receipt };
    this.event({ type: 'skill.transfer.verified', project_id: projectId, goal_id: goalId, message: receipt.status === 'passed' ? '技能已在第二个小场景迁移验证' : '技能迁移验证失败', data, evidence: [{ kind: 'transfer-root', root: receipt.evidence_root }] });
    return data;
  }

  demo({ reset = false, projectPath = null } = {}) {
    if (reset) this.store.reset();
    const projectId = 'project:vsr';
    const goalId = id('goal', { projectId, demo: true, at: new Date().toISOString() });
    this.event({ type: 'goal.created', project_id: projectId, goal_id: goalId, message: '升级 VSR 光照系统', data: { title: '升级 VSR 光照系统', instruction: '继续升级 VSR 的光照系统，优先解决阴影抖动。' } });
    this.event({ type: 'message.added', project_id: projectId, goal_id: goalId, message: '继续升级 VSR 的光照系统，优先解决阴影抖动。', data: { role: 'user' } });
    this.event({ type: 'plan.created', project_id: projectId, goal_id: goalId, message: '演示计划已建立', data: { steps: plans['dml.goal.create'] } });
    for (const [step_id, label] of [['read-context', '读取当前项目与最近修改'], ['inspect-problem', '检查阴影切分逻辑']]) {
      this.event({ type: 'step.started', project_id: projectId, goal_id: goalId, message: label, data: { step_id, label } });
      this.event({ type: 'step.completed', project_id: projectId, goal_id: goalId, message: `${label}完成`, data: { step_id, label } });
    }
    if (projectPath) this.execute({ type: 'dml.project.inspect', project_ref: { project_id: projectId }, goal_ref: goalId, payload: { path: projectPath, limit: 120 } });
    const artifactA = id('artifact', 'vsr-stability-first');
    this.event({ type: 'artifact.produced', project_id: projectId, goal_id: goalId, message: '稳定优先方案已生成', data: { artifact_id: artifactA, title: '稳定优先方案', summary: '优先消除近景阴影抖动，性能开销略增。', status: 'candidate', root: hash({ kind: 'stable', goalId }) } });
    this.event({ type: 'approval.requested', project_id: projectId, goal_id: goalId, message: '是否采用稳定优先方案？', data: { approval_id: id('approval-request', artifactA), artifact_id: artifactA, proposal_root: hash({ artifactA, goalId }) } });
    return this.project();
  }
}
