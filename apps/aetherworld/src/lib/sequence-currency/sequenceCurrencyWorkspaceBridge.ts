// Workspace 对象 → 数列货币系统关联桥（不重构 Workspace 数据模型）。
import { recordContribution } from "@/lib/currency/sequenceCurrencyEngine";
import { isFounderActive } from "@/lib/founderCalculus";
import type { ContributionTypeId } from "@/constants/currency/contributionTypes";

export interface WorkspaceObjectCurrencyInput {
  objectId: string;
  objectType: string;
  sourceChatMessageId?: string;
  sourceModel?: string;
  sourceCalculusChain?: string[];
  workspaceId?: string;
}

function mapObjectType(objectType: string): ContributionTypeId {
  const t = objectType.toUpperCase();
  if (t.includes("WORLD")) return "CREATE_WORLD";
  if (t.includes("NARRATIVE") || t.includes("STORY") || t.includes("QUEST")) return "CREATE_NARRATIVE";
  if (t.includes("VOCAL") || t.includes("MUSIC")) return "CREATE_VOCAL_PROMPT";
  if (t.includes("MODEL")) return "CREATE_MODEL";
  if (t.includes("KNOWLEDGE")) return "ADD_KNOWLEDGE";
  if (t.includes("PROMPT")) return "CREATE_PROMPT";
  return "EXPORT_ASSET";
}

export function recordWorkspaceObjectCurrencyEvent(input: WorkspaceObjectCurrencyInput) {
  const userMode = isFounderActive() ? "FOUNDER" : "LIGHT_20";
  const contributionType = mapObjectType(input.objectType);
  const chain = (input.sourceCalculusChain ?? []).join(" → ");
  try {
    return recordContribution({
      contributionType,
      userMode,
      qualityScore: 6,
      usefulnessScore: 6,
      validationScore: 5,
      complexityScore: Math.min(10, 4 + (input.sourceCalculusChain?.length ?? 0)),
      safetyScore: 8,
      duplicationRisk: 0,
      description: `Workspace 对象生成：${input.objectType} (${input.objectId})${chain ? " · 链 " + chain : ""}`,
      sourceEngine: "Workspace",
      sourceId: input.objectId,
    });
  } catch {
    return undefined;
  }
}
