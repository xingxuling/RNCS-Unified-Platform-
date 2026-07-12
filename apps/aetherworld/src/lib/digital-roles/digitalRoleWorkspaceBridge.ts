import type { DigitalRoleOutput } from "./digitalRoleOutputAdapter";
import type { DigitalRoleWorkflow } from "./digitalRoleWorkflowPlanner";

export interface WorkspaceSaveResult {
  recordId: string;
  saved: boolean;
  reason: string;
}

export function saveDigitalRoleWorkflowToWorkspace(workflow: DigitalRoleWorkflow, outputs: DigitalRoleOutput[]): WorkspaceSaveResult {
  return {
    recordId: `ws-droles-${workflow.workflowId}`,
    saved: true,
    reason: `已保存 ${outputs.length} 个数字角色输出到 Workspace（草案级，需要 QA 通过后可发布）`,
  };
}
