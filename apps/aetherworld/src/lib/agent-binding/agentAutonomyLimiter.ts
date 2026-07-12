import { ACTIONS_REQUIRING_CONFIRMATION, FORBIDDEN_AUTONOMOUS_ACTIONS } from "@/constants/agent-binding/agentAutonomyLevels";
import type { AgentBindingProfile } from "./agentKnowledgePersonalityBindingCalculus";

export function checkAutonomy(profile: AgentBindingProfile, action: string): { allowed: boolean; requiresConfirmation: boolean; reason: string } {
  if (FORBIDDEN_AUTONOMOUS_ACTIONS.includes(action)) return { allowed: false, requiresConfirmation: false, reason: "禁止的自主动作" };
  if (ACTIONS_REQUIRING_CONFIRMATION.includes(action)) return { allowed: true, requiresConfirmation: true, reason: "高风险动作，必须人工确认" };
  return { allowed: true, requiresConfirmation: false, reason: `自主等级 ${profile.autonomyPolicy.autonomyLevel} 允许` };
}
