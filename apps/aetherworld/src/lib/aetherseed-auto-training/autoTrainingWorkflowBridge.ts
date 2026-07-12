// AetherSeed Auto Training Executor · Training Workflow 桥（预留）
// 当前 Training Workflow Orchestrator 仍在落地，本桥仅记录回调点位，不强依赖。

export type AutoTrainingWorkflowStep =
  | "BUILD_LOCAL_TRAINING_PLAN"
  | "AUTO_TRAINING_DRY_RUN"
  | "WAITING_CONFIRMATION"
  | "AUTO_TRAINING_EXECUTION"
  | "RECORD_RESULT"
  | "UPDATE_BLOODLINE";

export interface WorkflowStepEvent {
  workflowRunId: string;
  step: AutoTrainingWorkflowStep;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "WAITING";
  at: string;
  note?: string;
}

const EVENTS: WorkflowStepEvent[] = [];

export function emitWorkflowStep(ev: Omit<WorkflowStepEvent, "at">) {
  EVENTS.push({ ...ev, at: new Date().toISOString() });
}

export function listWorkflowEvents(workflowRunId?: string): WorkflowStepEvent[] {
  return workflowRunId ? EVENTS.filter((e) => e.workflowRunId === workflowRunId) : [...EVENTS];
}
