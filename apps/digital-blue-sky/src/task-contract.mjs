import { hash, id, now } from './canonical.mjs';

export const TASK_CONTRACT_FORMAT = 'dml.task-contract.v0.4';
export const TASK_PLAN_FORMAT = 'dml.task-plan.v0.4';
export const TASK_STATE_FORMAT = 'dml.task-state.v0.4';
export const TASK_RESULT_FORMAT = 'dml.task-result.v0.4';

export function createTaskContract({ action, projectPath, instruction } = {}) {
  const contract = {
    format: TASK_CONTRACT_FORMAT,
    task_id: id('task', { action_id: action?.action_id, instruction, at: now() }),
    action_id: action?.action_id || null,
    project_id: action?.project_ref?.project_id || 'project:vsr',
    project_path: projectPath,
    instruction: String(instruction || '').trim(),
    payload: structuredClone(action?.payload || {}),
    constraints: {
      max_command_seconds: Number(action?.constraints?.max_command_seconds || 600),
      max_output_bytes: Number(action?.constraints?.max_output_bytes || 2_000_000),
      prefer_local: action?.constraints?.prefer_local ?? true,
      offline_first: action?.constraints?.offline_first ?? true,
      ...structuredClone(action?.constraints || {}),
    },
    authority: {
      max_risk: action?.authority?.max_risk || 'medium',
      require_reversible: action?.authority?.require_reversible ?? true,
      approval_mode: action?.authority?.approval_mode || 'when-required',
    },
    created_at: now(),
  };
  contract.contract_root = hash(contract);
  return contract;
}

export function createTaskPlan(contract, operations, metadata = {}) {
  const plan = {
    format: TASK_PLAN_FORMAT,
    plan_id: id('task-plan', { task_id: contract.task_id, operations, at: now() }),
    task_id: contract.task_id,
    project_id: contract.project_id,
    operations: operations.map((operation, index) => ({
      operation_id: operation.operation_id || id('task-operation', { task_id: contract.task_id, index, type: operation.type }),
      sequence: index + 1,
      status: 'waiting',
      risk: 'low',
      reversible: true,
      requires_approval: false,
      ...structuredClone(operation),
    })),
    metadata: structuredClone(metadata),
    created_at: now(),
  };
  plan.plan_root = hash(plan);
  return plan;
}

export function createTaskState(contract, plan) {
  return {
    format: TASK_STATE_FORMAT,
    task_id: contract.task_id,
    contract,
    plan,
    status: 'queued',
    active_operation_index: 0,
    outputs: [],
    artifacts: [],
    evidence: [],
    changed_files: [],
    candidates: [],
    error: null,
    started_at: now(),
    updated_at: now(),
    completed_at: null,
  };
}

export function createTaskResult(taskState) {
  const result = {
    format: TASK_RESULT_FORMAT,
    result_id: id('task-result', { task_id: taskState.task_id, status: taskState.status, at: now() }),
    task_id: taskState.task_id,
    project_id: taskState.contract.project_id,
    status: taskState.status,
    operations_total: taskState.plan.operations.length,
    operations_completed: taskState.plan.operations.filter((operation) => operation.status === 'completed').length,
    outputs: structuredClone(taskState.outputs),
    artifacts: structuredClone(taskState.artifacts),
    evidence: structuredClone(taskState.evidence),
    changed_files: structuredClone(taskState.changed_files),
    candidates: structuredClone(taskState.candidates),
    error: structuredClone(taskState.error),
    started_at: taskState.started_at,
    completed_at: taskState.completed_at || now(),
  };
  result.result_root = hash(result);
  return result;
}
