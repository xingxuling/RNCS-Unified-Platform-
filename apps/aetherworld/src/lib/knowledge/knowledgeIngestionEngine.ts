// 知识录入
import {
  upsertKnowledgeEntry,
  type KnowledgeEntry,
} from "./knowledgeSourceRegistry";
import { classifyKnowledge } from "./knowledgeClassifier";
import { getKnowledgeType, type KnowledgeTypeId } from "@/constants/knowledge/knowledgeTypes";
import { getKnowledgeSourceType, type KnowledgeSourceTypeId } from "@/constants/knowledge/knowledgeSourceTypes";
import type { KnowledgeAccessLevel } from "@/constants/knowledge/knowledgeAccessLevels";
import type { KnowledgeTrustLevel } from "@/constants/knowledge/knowledgeTrustLevels";
import type { KnowledgeFreshnessLevel } from "@/constants/knowledge/knowledgeFreshnessLevels";

export interface KnowledgeIngestionInput {
  title: string;
  body: string;
  summary?: string;
  sourceType: KnowledgeSourceTypeId;
  knowledgeType?: KnowledgeTypeId;
  tags?: string[];
  relatedEngines?: string[];
  accessLevel?: KnowledgeAccessLevel;
  trustLevel?: KnowledgeTrustLevel;
  freshnessLevel?: KnowledgeFreshnessLevel;
  language?: string;
}

export interface KnowledgeIngestionResult {
  entry: KnowledgeEntry;
  classification: KnowledgeTypeId;
  trustSuggestion: KnowledgeTrustLevel;
  freshnessSuggestion: KnowledgeFreshnessLevel;
  warnings: string[];
}

export function ingestKnowledge(input: KnowledgeIngestionInput): KnowledgeIngestionResult {
  const warnings: string[] = [];
  if (!input.title.trim()) warnings.push("标题为空，建议补充。");
  if (!input.body.trim()) warnings.push("正文为空。");
  if (!input.sourceType) warnings.push("缺少来源类型。");

  const classified = input.knowledgeType ?? classifyKnowledge(`${input.title} ${input.body}`).type;
  const typeDef = getKnowledgeType(classified);
  const sourceDef = getKnowledgeSourceType(input.sourceType);

  const accessLevel = input.accessLevel ?? typeDef.defaultAccess;
  const trustLevel = input.trustLevel ?? typeDef.defaultTrust;
  let freshness: KnowledgeFreshnessLevel = input.freshnessLevel ?? "SLOW_CHANGING";
  if (classified === "REAL_WORLD_FACT") freshness = input.freshnessLevel ?? "TIME_SENSITIVE";
  if (classified === "MSL_KNOWLEDGE" || classified === "FICTIONAL_LORE") freshness = input.freshnessLevel ?? "STATIC";

  // 安全检查：不要自动公开用户私有
  if (classified === "USER_PERSONAL" && accessLevel === "PUBLIC") {
    warnings.push("用户私有知识不应公开，已强制改为 USER_PRIVATE。");
  }
  const finalAccess: KnowledgeAccessLevel = classified === "USER_PERSONAL" && accessLevel === "PUBLIC" ? "USER_PRIVATE" : accessLevel;

  const entry: KnowledgeEntry = {
    id: `kn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    title: input.title.trim() || "未命名条目",
    summary: input.summary?.trim() || input.body.slice(0, 120),
    body: input.body,
    knowledgeType: classified,
    sourceType: input.sourceType,
    tags: input.tags ?? [],
    relatedEngines: input.relatedEngines ?? [],
    accessLevel: finalAccess,
    trustLevel,
    freshnessLevel: freshness,
    citationRequired: sourceDef.citationRequired,
    citations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stale: false,
    language: input.language ?? "zh-CN",
  };

  const saved = upsertKnowledgeEntry(entry);

  return {
    entry: saved,
    classification: classified,
    trustSuggestion: trustLevel,
    freshnessSuggestion: freshness,
    warnings,
  };
}
