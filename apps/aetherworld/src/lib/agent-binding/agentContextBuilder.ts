import { bindKnowledgeLayer } from "./agentKnowledgeLayerBinder";
import { bindSubjectPersonality } from "./agentSubjectPersonalityBinder";
import { resolveCalculusRoute } from "./agentCalculusRouter";
import type { AgentBindingProfile } from "./agentKnowledgePersonalityBindingCalculus";

export interface AetherAgentContext {
  bindingProfile: AgentBindingProfile;
  userIntent: string;
  subjectPersonalitySummary: Record<string, unknown>;
  knowledgeContext: { sources: string[]; warnings: string[] };
  calculusRoute: { selected: string; chain: string[] };
  objectInputs: object[];
  runtimeRules: string[];
  governanceRules: string[];
  memoryPolicy: AgentBindingProfile["memoryPolicy"];
  autonomyPolicy: AgentBindingProfile["autonomyPolicy"];
  workspaceContext?: object;
  safetyNotes: string[];
}

export function buildAgentContext(profile: AgentBindingProfile, userIntent: string, objectInputs: object[] = []): AetherAgentContext {
  const k = bindKnowledgeLayer(profile);
  const p = bindSubjectPersonality(profile);
  const r = resolveCalculusRoute(profile, userIntent);
  return {
    bindingProfile: profile,
    userIntent,
    subjectPersonalitySummary: p.summary,
    knowledgeContext: { sources: k.binding.enabledKnowledgeSources, warnings: [...k.warnings, ...p.warnings] },
    calculusRoute: { selected: r.selected, chain: r.chain },
    objectInputs,
    runtimeRules: profile.runtimeBinding.allowedRuntimeSteps,
    governanceRules: profile.governanceBinding.rules,
    memoryPolicy: profile.memoryPolicy,
    autonomyPolicy: profile.autonomyPolicy,
    safetyNotes: profile.safetyNotes,
  };
}
