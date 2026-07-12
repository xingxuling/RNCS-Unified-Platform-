// 工作流 × Workspace 桥 v0.1
// 安全：只读 + 只在 workflow 描述中引用 workspace id，不持久化敏感字段。
import type { TrainingWorkflow } from "./trainingWorkflowTypes";

export interface WorkflowWorkspaceLink {
  workflowId: string;
  workspaceHint: string;
}

export function describeWorkflowForWorkspace(wf: TrainingWorkflow): WorkflowWorkspaceLink {
  return {
    workflowId: wf.id,
    workspaceHint: `训练工作流：${wf.title} · 目标 ${wf.targetModel} · 状态 ${wf.overallStatus}`,
  };
}
