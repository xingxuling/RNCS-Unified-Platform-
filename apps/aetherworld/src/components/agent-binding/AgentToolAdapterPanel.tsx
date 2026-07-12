import type { AgentBindingProfile } from "@/lib/agent-binding/agentKnowledgePersonalityBindingCalculus";

export function AgentToolAdapterPanel({ profile }: { profile: AgentBindingProfile }) {
  return (
    <div className="aether-card p-3 space-y-2 text-xs">
      <div className="text-[11px] text-muted-foreground">工具适配</div>
      <div><span className="text-muted-foreground">外部工具：</span>{profile.sourceToolName || "（自定义）"}</div>
      <div><span className="text-muted-foreground">用途：</span>{profile.bindingPurpose}</div>
      <div><span className="text-muted-foreground">允许动作：</span>{profile.allowedActions.join("、")}</div>
      <div><span className="text-muted-foreground">禁止动作：</span>{profile.forbiddenActions.join("、")}</div>
    </div>
  );
}
