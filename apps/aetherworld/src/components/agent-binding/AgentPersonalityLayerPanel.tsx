import type { AgentPersonalityBinding } from "@/lib/agent-binding/agentKnowledgePersonalityBindingCalculus";

export function AgentPersonalityLayerPanel({ binding }: { binding: AgentPersonalityBinding }) {
  return (
    <div className="aether-card p-3 space-y-2 text-xs">
      <div className="text-[11px] text-muted-foreground">主体人格层 · Subject：{binding.subjectMode} · Privacy：{binding.privacyLevel}</div>
      <div><span className="text-muted-foreground">人格源：</span>{binding.personalitySource.join("、")}</div>
      <div><span className="text-muted-foreground">判断风格：</span>{binding.judgmentStyle.join("、")}</div>
      <div><span className="text-muted-foreground">输出风格：</span>{binding.outputStyle.join("、")}</div>
      <div><span className="text-muted-foreground">风险偏好：</span>{binding.riskPreference}</div>
      <div><span className="text-muted-foreground">禁止用途：</span>{binding.forbiddenPersonalityUses.join("、")}</div>
    </div>
  );
}
