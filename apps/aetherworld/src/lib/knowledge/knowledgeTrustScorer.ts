// 信任度评分
import { getTrustLevelScore, type KnowledgeTrustLevel } from "@/constants/knowledge/knowledgeTrustLevels";
import type { KnowledgeEntry } from "./knowledgeSourceRegistry";

export interface TrustScoreResult {
  trustLevel: KnowledgeTrustLevel;
  score: number;
  reason: string;
  recommendedUse: string;
}

export function scoreTrust(entry: KnowledgeEntry): TrustScoreResult {
  let level: KnowledgeTrustLevel = entry.trustLevel;
  const reasons: string[] = [];
  if (entry.sourceType === "FOUNDER_LOCKED") { level = "FOUNDER_LOCKED"; reasons.push("Founder 锁定来源"); }
  else if (entry.sourceType === "PRODUCT_ENCYCLOPEDIA" && level === "LOW") { level = "MEDIUM"; reasons.push("百科条目至少 MEDIUM"); }
  if (entry.citations && entry.citations.length > 0 && (level === "LOW" || level === "MEDIUM")) {
    level = "VERIFIED"; reasons.push("含引用，升级为 VERIFIED");
  }
  if (entry.stale && level !== "FOUNDER_LOCKED") {
    level = level === "VERIFIED" ? "HIGH" : "LOW";
    reasons.push("条目过期，下调信任");
  }
  const score = getTrustLevelScore(level);
  const recommended = level === "LOW"
    ? "仅供参考，不建议直接给最终用户"
    : level === "MEDIUM"
    ? "可用，但建议补充来源或回验"
    : level === "HIGH"
    ? "可用于生成与解释"
    : level === "VERIFIED"
    ? "可对外引用"
    : "标准定义，可直接使用";
  return { trustLevel: level, score, reason: reasons.join("；") || "保持原始信任等级", recommendedUse: recommended };
}
