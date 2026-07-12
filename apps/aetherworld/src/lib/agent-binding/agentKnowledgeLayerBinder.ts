import { AGENT_KNOWLEDGE_SOURCES } from "@/constants/agent-binding/agentKnowledgeSources";
import type { AgentBindingProfile, AgentKnowledgeBinding } from "./agentKnowledgePersonalityBindingCalculus";

export function bindKnowledgeLayer(profile: AgentBindingProfile): { binding: AgentKnowledgeBinding; warnings: string[] } {
  const warnings: string[] = [];
  const b = profile.knowledgeBinding;
  for (const id of b.enabledKnowledgeSources) {
    const src = AGENT_KNOWLEDGE_SOURCES.find((s) => s.id === id);
    if (!src) { warnings.push(`未知知识源：${id}`); continue; }
    if (src.privacy === "FOUNDER_PRIVATE" && profile.personalityBinding.subjectMode !== "FOUNDER") {
      warnings.push(`知识源 ${src.label} 仅 Founder 可用，已自动隔离`);
    }
  }
  return { binding: b, warnings };
}
