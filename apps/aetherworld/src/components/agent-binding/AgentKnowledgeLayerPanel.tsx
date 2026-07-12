import type { AgentKnowledgeBinding } from "@/lib/agent-binding/agentKnowledgePersonalityBindingCalculus";

export function AgentKnowledgeLayerPanel({ binding }: { binding: AgentKnowledgeBinding }) {
  return (
    <div className="aether-card p-3 space-y-2 text-xs">
      <div className="text-[11px] text-muted-foreground">知识层绑定 · Scope：{binding.knowledgeScope}</div>
      <div><span className="text-muted-foreground">已启用：</span>{binding.enabledKnowledgeSources.join("、") || "—"}</div>
      <div><span className="text-muted-foreground">必需：</span>{binding.requiredKnowledgeSources.join("、") || "—"}</div>
      <div><span className="text-muted-foreground">禁止：</span>{binding.forbiddenKnowledgeTypes.join("、") || "—"}</div>
      <div className="text-[11px] text-muted-foreground">过期策略：{binding.staleKnowledgePolicy} · 来源策略：{binding.citationOrSourcePolicy}</div>
    </div>
  );
}
