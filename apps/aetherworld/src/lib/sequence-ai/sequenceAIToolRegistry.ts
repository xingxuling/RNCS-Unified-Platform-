import { SEQUENCE_AI_TOOL_POLICIES } from "@/constants/sequence-ai/sequenceAIToolPolicies";

export interface SequenceAITool {
  id: string;
  name: string;
  purpose: string;
  allowedIntents: string[];
  requiredMode: "ANY" | "REAL" | "FOUNDER";
  riskLevel: string;
  canExport: boolean;
  canWrite: boolean;
  userVisibleName: string;
  route?: string;
}

export function getSequenceAITools(): SequenceAITool[] {
  return SEQUENCE_AI_TOOL_POLICIES.map((p) => ({
    id: p.engineId,
    name: p.userVisibleName,
    purpose: p.purpose,
    allowedIntents: p.allowedIntents,
    requiredMode: p.requiredMode,
    riskLevel: p.riskLevel,
    canExport: p.canExport,
    canWrite: p.canWrite,
    userVisibleName: p.userVisibleName,
    route: p.route,
  }));
}

export function getToolById(id: string): SequenceAITool | undefined {
  return getSequenceAITools().find((t) => t.id === id);
}

export function getToolRoute(id: string): string | undefined {
  return getToolById(id)?.route;
}
