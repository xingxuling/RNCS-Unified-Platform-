import type { AgentBindingProfile } from "./agentKnowledgePersonalityBindingCalculus";

export interface AgentSafetyResult {
  ok: boolean;
  notes: string[];
}

export function evaluateAgentSafety(profile: AgentBindingProfile): AgentSafetyResult {
  const notes: string[] = [];
  if (profile.personalityBinding.subjectMode === "FULL_60" && profile.personalityBinding.privacyLevel === "PUBLIC_DEMO")
    notes.push("Full60 与公开输出冲突：已强制降级为人格摘要");
  if (profile.autonomyPolicy.autonomyLevel === "EXECUTE_SAFE" && profile.agentType === "DEPLOYMENT_AGENT")
    notes.push("部署 Agent 不允许 EXECUTE_SAFE：必须人工确认");
  return { ok: notes.length === 0, notes };
}
