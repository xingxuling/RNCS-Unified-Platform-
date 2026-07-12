import type { DigitalRoleWorkflow } from "@/lib/digital-roles/digitalRoleWorkflowPlanner";

export function DigitalRoleWorkflowPanel({ workflow }: { workflow: DigitalRoleWorkflow }) {
  return (
    <div className="aether-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">协作流程 · {workflow.workflowType}</div>
        <div className="text-[10px] text-muted-foreground">{workflow.steps.length} 步</div>
      </div>
      <ol className="space-y-1.5">
        {workflow.steps.map((s, i) => (
          <li key={s.stepId} className="flex items-center gap-2 text-xs">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center">{i + 1}</span>
            <span className="font-medium">{s.roleId}</span>
            <span className="text-muted-foreground">→ {s.outputSummary}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
