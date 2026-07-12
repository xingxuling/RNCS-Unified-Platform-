import type { AgentBindingProfile } from "./agentKnowledgePersonalityBindingCalculus";

export interface AetherAgentOutput {
  outputId: string;
  bindingId: string;
  agentName: string;
  outputType: string;
  title: string;
  summary: string;
  structuredResult: Record<string, unknown>;
  producedObjects: string[];
  nextSuggestedActions: string[];
  qaResult?: object;
  governanceResult?: object;
  workspaceRecordId?: string;
  traceId?: string;
  safetyNotes: string[];
}

export function adaptAgentOutput(profile: AgentBindingProfile, userIntent: string, structured: Record<string, unknown>, traceId?: string): AetherAgentOutput {
  return {
    outputId: `out-${profile.bindingId}-${Date.now()}`,
    bindingId: profile.bindingId,
    agentName: profile.agentName,
    outputType: profile.outputProfile,
    title: `${profile.agentName} · 输出草案`,
    summary: `针对「${userIntent}」生成草案，需通过 QA 与人工确认后才能落地。`,
    structuredResult: structured,
    producedObjects: profile.objectInterfaceBinding.producedOutputObjectTypes,
    nextSuggestedActions: ["运行 QA", "提交人工确认", "保存到 Workspace"],
    traceId,
    safetyNotes: profile.safetyNotes,
  };
}
