import type { WorldMutationType } from "@/constants/sequence-world/growth/worldMutationTypes";
import type { CausalChainNode } from "../simulation/causalChainEngine";

export interface MutationInput {
  targetId: string;
  targetType: "ZONE" | "NPC" | "QUEST" | "RESOURCE" | "RULE" | "TIMELINE";
  mutationPressure?: number;
  sourceDigits?: string[];
  causalContext?: CausalChainNode[];
  before?: Record<string, unknown>;
}

export interface MutationResult {
  mutationType: WorldMutationType;
  targetId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  mutationReason: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  canonImpact: string[];
}

function chooseMutationType(input: MutationInput): WorldMutationType {
  const d = input.sourceDigits?.[0] ?? "5";
  if (d === "7") return "NARRATIVE_MUTATION";
  if (d === "9") return "TERMINAL_MUTATION";
  if (d === "6") return "RELATION_MUTATION";
  if (d === "4") return "RULE_MUTATION";
  if (d === "0") return "ZONE_STATE_MUTATION";
  switch (input.targetType) {
    case "ZONE": return "ZONE_STATE_MUTATION";
    case "NPC": return "NPC_ROLE_MUTATION";
    case "QUEST": return "QUEST_MUTATION";
    case "RESOURCE": return "RESOURCE_MUTATION";
    case "RULE": return "RULE_MUTATION";
    case "TIMELINE": return "TERMINAL_MUTATION";
  }
}

export function mutateAsset(input: MutationInput): MutationResult {
  const mutationType = chooseMutationType(input);
  const pressure = input.mutationPressure ?? 0.5;
  const before = input.before ?? { id: input.targetId };
  const after: Record<string, unknown> = { ...before, mutatedAt: new Date().toISOString(), mutationType };
  let reason = `主导数 ${input.sourceDigits?.[0] ?? "5"} 引发 ${mutationType}`;
  let risk: MutationResult["riskLevel"] = pressure > 0.75 ? "HIGH" : pressure > 0.4 ? "MEDIUM" : "LOW";
  const canonImpact: string[] = [`${input.targetType} ${input.targetId} 已发生 ${mutationType}`];

  if (mutationType === "TERMINAL_MUTATION") {
    after.state = "TERMINAL";
    canonImpact.push("可能触发终局相关正典更新");
    risk = "HIGH";
  }
  if (mutationType === "RULE_MUTATION") {
    after.requiresExplanation = true;
    reason += "；规则突变需附解释";
  }
  return { mutationType, targetId: input.targetId, before, after, mutationReason: reason, riskLevel: risk, canonImpact };
}
