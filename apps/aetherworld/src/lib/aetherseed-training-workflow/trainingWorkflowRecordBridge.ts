// 工作流 × Record Center 桥 v0.1
import type { TrainingWorkflow, WorkflowStepId } from "./trainingWorkflowTypes";

export interface WorkflowRecordEntry {
  workflowId: string;
  ts: number;
  type: "CREATE" | "STEP" | "CONFIRM" | "DONE" | "FAIL";
  stepId?: WorkflowStepId;
  message: string;
}

export function buildCreateRecord(wf: TrainingWorkflow): WorkflowRecordEntry {
  return {
    workflowId: wf.id,
    ts: wf.createdAt,
    type: "CREATE",
    message: `创建训练工作流「${wf.title}」目标 ${wf.targetModel}`,
  };
}

export function buildStepRecord(
  wf: TrainingWorkflow,
  stepId: WorkflowStepId,
  message: string,
): WorkflowRecordEntry {
  return {
    workflowId: wf.id,
    ts: Date.now(),
    type: "STEP",
    stepId,
    message,
  };
}
