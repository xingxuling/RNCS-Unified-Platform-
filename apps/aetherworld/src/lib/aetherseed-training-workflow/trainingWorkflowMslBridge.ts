// 工作流 × MSL 桥 v0.1
import type { TrainingWorkflow } from "./trainingWorkflowTypes";

export interface WorkflowMslSummary {
  workflowId: string;
  mslDigest: string;
}

export function buildMslDigest(wf: TrainingWorkflow): WorkflowMslSummary {
  const stepsDone = wf.steps.filter((s) => s.status === "DONE").length;
  return {
    workflowId: wf.id,
    mslDigest: `WF:${wf.id}|TGT:${wf.targetModel}|DONE:${stepsDone}/${wf.steps.length}|OVERALL:${wf.overallStatus}`,
  };
}
