import type { AgentBindingProfile } from "./agentKnowledgePersonalityBindingCalculus";

export interface AgentQaResult {
  status: "PASS" | "WARN" | "FAIL";
  checks: { id: string; ok: boolean; note?: string }[];
}

export function runAgentBindingQa(profile: AgentBindingProfile): AgentQaResult {
  const checks = [
    { id: "knowledge_binding",  ok: profile.knowledgeBinding.enabledKnowledgeSources.length > 0 },
    { id: "personality_binding", ok: profile.personalityBinding.personalitySource.length > 0 },
    { id: "calculus_routing",    ok: !!profile.calculusRouting.defaultCalculusId },
    { id: "object_interface",    ok: profile.objectInterfaceBinding.producedOutputObjectTypes.length > 0 },
    { id: "runtime_binding",     ok: profile.runtimeBinding.requiresQa },
    { id: "governance_binding",  ok: profile.governanceBinding.constitutionRequired && profile.governanceBinding.qaRequired },
    { id: "memory_policy",       ok: !profile.memoryPolicy.canReadRawSequence },
    { id: "autonomy_policy",     ok: profile.autonomyPolicy.forbiddenAutonomousActions.length > 0 },
    { id: "full60_protected",    ok: profile.forbiddenActions.includes("LEAK_FULL60") },
    { id: "founder_protected",   ok: profile.forbiddenActions.includes("LEAK_FOUNDER") },
  ];
  const failed = checks.filter((c) => !c.ok).length;
  return { status: failed === 0 ? "PASS" : failed <= 2 ? "WARN" : "FAIL", checks };
}
