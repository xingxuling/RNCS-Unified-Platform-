import type { AgentBindingProfile } from "./agentKnowledgePersonalityBindingCalculus";

export function detectAgentBindingVersionLeap(profile: AgentBindingProfile) {
  return {
    changeType: "AGENT_SUBSTRATE_ADDED" as const,
    affectedScopes: ["AGENT", "KNOWLEDGE", "PERSONALITY", "RUNTIME", "GOVERNANCE", "OPEN_SOURCE_ADAPTERS", "WORKSPACE", "QA", "VERSION", "DOCS"],
    recommendedLevel: "LEAP" as const,
    releaseType: "AETHER_AGENT_SUBSTRATE_RELEASE" as const,
    moduleId: "agent-knowledge-personality-binding",
    bindingId: profile.bindingId,
  };
}
