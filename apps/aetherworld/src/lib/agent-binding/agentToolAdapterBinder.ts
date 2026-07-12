import type { AgentBindingProfile } from "./agentKnowledgePersonalityBindingCalculus";

export function adaptAgentTool(profile: AgentBindingProfile): { adapterId: string; tool: string; mode: string; notes: string[] } {
  return {
    adapterId: `adapter-${profile.bindingId}`,
    tool: profile.sourceToolName || profile.agentName,
    mode: profile.runtimeBinding.runtimeMode,
    notes: [
      "工具能力被 Aetherworld 知识/人格/治理层包裹",
      "外部 API 调用必须通过 Object Interface 转换",
    ],
  };
}
