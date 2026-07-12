// 新鲜度
import { staleDaysFor, type KnowledgeFreshnessLevel } from "@/constants/knowledge/knowledgeFreshnessLevels";
import type { KnowledgeEntry } from "./knowledgeSourceRegistry";

export interface FreshnessResult {
  freshnessLevel: KnowledgeFreshnessLevel;
  ageDays: number;
  stale: boolean;
  warning?: string;
}

export function evaluateFreshness(entry: KnowledgeEntry): FreshnessResult {
  const ageMs = Date.now() - new Date(entry.updatedAt).getTime();
  const ageDays = Math.max(0, Math.round(ageMs / (1000 * 60 * 60 * 24)));
  const limit = staleDaysFor(entry.freshnessLevel);
  const stale = entry.stale || ageDays > limit;
  let warning: string | undefined;
  if (stale) warning = `条目已超过 ${limit} 天未更新，建议核对最新资料。`;
  if (entry.freshnessLevel === "LIVE_REQUIRED") warning = "该信息需要每次实时验证。";
  else if (entry.freshnessLevel === "TIME_SENSITIVE" && ageDays > 7) warning = warning ?? "该信息可能需要最新验证。";
  return { freshnessLevel: entry.freshnessLevel, ageDays, stale, warning };
}
