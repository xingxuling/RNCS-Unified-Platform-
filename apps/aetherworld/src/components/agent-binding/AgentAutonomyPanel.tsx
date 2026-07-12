import type { AgentAutonomyPolicy } from "@/lib/agent-binding/agentKnowledgePersonalityBindingCalculus";

export function AgentAutonomyPanel({ policy }: { policy: AgentAutonomyPolicy }) {
  return (
    <div className="aether-card p-3 text-xs space-y-1">
      <div className="text-[11px] text-muted-foreground">自主策略 · {policy.autonomyLevel}</div>
      <div><span className="text-muted-foreground">允许：</span>{policy.allowedAutonomousActions.join("、")}</div>
      <div><span className="text-muted-foreground">需确认：</span>{policy.actionsRequiringConfirmation.join("、")}</div>
      <div className="text-red-300"><span className="text-muted-foreground">禁止：</span>{policy.forbiddenAutonomousActions.join("、")}</div>
    </div>
  );
}
