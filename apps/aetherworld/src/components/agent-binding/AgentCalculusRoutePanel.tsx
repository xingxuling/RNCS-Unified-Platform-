import type { AgentCalculusRouting } from "@/lib/agent-binding/agentKnowledgePersonalityBindingCalculus";

export function AgentCalculusRoutePanel({ routing }: { routing: AgentCalculusRouting }) {
  return (
    <div className="aether-card p-3 space-y-2 text-xs">
      <div className="text-[11px] text-muted-foreground">计算法路由 · 策略：{routing.routingPolicy}</div>
      <div><span className="text-muted-foreground">默认：</span>{routing.defaultCalculusId}</div>
      <div><span className="text-muted-foreground">允许：</span>{routing.allowedCalculusIds.join("、")}</div>
      <div><span className="text-muted-foreground">必需：</span>{routing.requiredCalculusIds.join("、") || "—"}</div>
      <div><span className="text-muted-foreground">回退：</span>{routing.fallbackCalculusIds.join("、") || "—"}</div>
    </div>
  );
}
