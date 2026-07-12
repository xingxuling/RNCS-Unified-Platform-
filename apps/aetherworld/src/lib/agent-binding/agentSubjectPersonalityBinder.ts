import { AGENT_PERSONALITY_SOURCES } from "@/constants/agent-binding/agentPersonalitySources";
import type { AgentBindingProfile, AgentPersonalityBinding } from "./agentKnowledgePersonalityBindingCalculus";

export function bindSubjectPersonality(profile: AgentBindingProfile): { binding: AgentPersonalityBinding; summary: Record<string, unknown>; warnings: string[] } {
  const warnings: string[] = [];
  const b = profile.personalityBinding;
  for (const src of b.personalitySource) {
    const meta = AGENT_PERSONALITY_SOURCES.find((s) => s.id === src);
    if (meta?.privacy === "FOUNDER_PRIVATE" && b.subjectMode !== "FOUNDER") {
      warnings.push(`人格源 ${meta.label} 仅 Founder 可用，已降级为摘要`);
    }
    if (src === "FULL60_SEQUENCE_PROFILE") {
      warnings.push("Full60 原始数列不会暴露，仅使用人格摘要");
    }
  }
  const summary = {
    subjectMode: b.subjectMode,
    judgment: b.judgmentStyle,
    output: b.outputStyle,
    risk: b.riskPreference,
    communication: b.communicationStyle,
  };
  return { binding: b, summary, warnings };
}
