import type { DigitalRoleWorkflow } from "./digitalRoleWorkflowPlanner";

export interface CollaborationEdge {
  from: string;
  to: string;
  label: string;
}

export function buildCollaborationGraph(workflow: DigitalRoleWorkflow): { nodes: string[]; edges: CollaborationEdge[] } {
  const nodes = workflow.steps.map((s) => s.roleId);
  const edges: CollaborationEdge[] = [];
  for (let i = 0; i < workflow.steps.length - 1; i++) {
    edges.push({
      from: workflow.steps[i].roleId,
      to: workflow.steps[i + 1].roleId,
      label: "输出 → 输入",
    });
  }
  return { nodes, edges };
}
