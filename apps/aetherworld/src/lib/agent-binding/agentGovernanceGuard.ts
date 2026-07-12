import { CRITICAL_BLOCK_RULES } from "@/constants/agent-binding/agentGovernanceRules";
import type { AgentBindingProfile } from "./agentKnowledgePersonalityBindingCalculus";

export interface GovernanceCheckResult {
  ok: boolean;
  blocked: string[];
  warnings: string[];
}

export function checkAgentGovernance(profile: AgentBindingProfile, userIntent: string): GovernanceCheckResult {
  const warnings: string[] = [];
  const blocked: string[] = [];
  const text = userIntent.toLowerCase();
  if (/部署|deploy|发布|publish/.test(text) && profile.autonomyPolicy.autonomyLevel !== "EXECUTE_WITH_CONFIRMATION") {
    warnings.push("涉及部署/发布动作，必须人工确认");
  }
  if (/删除|delete|drop/.test(text)) warnings.push("涉及删除动作，必须人工确认");
  if (/full60|founder/.test(text) && profile.personalityBinding.privacyLevel !== "FOUNDER_PRIVATE") {
    blocked.push("FULL60_OR_FOUNDER_PUBLIC_OUTPUT");
  }
  if (/eval\(|rm -rf|sudo/.test(text)) blocked.push("DANGEROUS_CODE_EXECUTION");
  return { ok: blocked.length === 0, blocked, warnings: [...warnings, ...CRITICAL_BLOCK_RULES.filter(() => false)] };
}
