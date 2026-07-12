import type { ExternalDataSource } from "./externalDataSourceRegistry";
import { listExternalDataSources } from "./externalDataSourceRegistry";
import { type DataCredibilityLevel, levelForScore } from "@/constants/reality-data/dataCredibilityLevels";

export interface CredibilityScore {
  sourceId: string;
  score: number;
  level: DataCredibilityLevel;
  reasons: string[];
  risks: string[];
}

const BASE: Record<string, number> = {
  OFFICIAL_STATISTICS: 0.9,
  ACADEMIC_DATA: 0.82,
  RANKING_DATA: 0.78,
  MARKET_DATA: 0.78,
  PRODUCT_USAGE_DATA: 0.8,
  VALIDATION_DATA: 0.78,
  API_STRUCTURED_DATA: 0.75,
  PUBLIC_WEB: 0.62,
  PERSONAL_LOCAL_DATA: 0.6,
  USER_PROVIDED: 0.55,
  FICTIONAL_WORLD_DATA: 0.1,
  DEMO_DATA: 0.05,
};

export function scoreCredibility(source: ExternalDataSource): CredibilityScore {
  let score = BASE[source.sourceType] ?? 0.5;
  const reasons: string[] = [`基准分: ${score.toFixed(2)} (${source.sourceType})`];
  const risks: string[] = [];
  if (source.url) { score += 0.03; reasons.push("提供来源链接。"); }
  if (source.provider) { score += 0.02; reasons.push("提供发布机构。"); }
  if (source.dataDate) { score += 0.02; reasons.push("有数据日期。"); }
  if (!source.dataDate) { risks.push("缺少数据日期。"); }
  if (source.sourceType === "FICTIONAL_WORLD_DATA" || source.sourceType === "DEMO_DATA") {
    risks.push("不能作为现实证据。");
  }
  score = Math.max(0, Math.min(1, score));
  return { sourceId: source.sourceId, score, level: levelForScore(score), reasons, risks };
}

export function scoreAll(): CredibilityScore[] {
  return listExternalDataSources().map(scoreCredibility);
}
