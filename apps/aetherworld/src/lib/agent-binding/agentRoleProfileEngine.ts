import type { AgentBindingProfile } from "./agentKnowledgePersonalityBindingCalculus";

export function buildAgentRoleProfile(profile: AgentBindingProfile): { roles: string[]; lead: string } {
  const map: Record<string, string[]> = {
    APP_BUILDER_AGENT: ["Digital Product Manager", "Digital Architect", "Digital Programmer", "Digital QA", "Digital Documentation Lead"],
    MUSIC_GENERATION_AGENT: ["Digital Music Director", "Digital Narrative Director", "Digital QA"],
    WORKFLOW_AGENT: ["Digital System Strategist", "Digital Planner", "Digital QA", "Digital Governance Officer"],
    DEPLOYMENT_AGENT: ["Digital Governance Officer", "Digital QA"],
    QA_AGENT: ["Digital QA"],
  };
  const roles = map[profile.agentType] || ["Digital Programmer", "Digital QA"];
  return { roles, lead: roles[0] };
}
