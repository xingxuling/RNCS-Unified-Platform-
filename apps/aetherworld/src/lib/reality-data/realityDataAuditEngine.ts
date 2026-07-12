import { listExternalDataSources } from "./externalDataSourceRegistry";
import { detectAll as detectAllFreshness } from "./dataFreshnessDetector";
import { scoreAll } from "./sourceCredibilityScorer";
import { detectAllNoise } from "./dataNoiseFilter";
import { REALITY_DATA_SAFETY_RULES } from "@/constants/reality-data/realityDataSafetyRules";

export interface RealityDataAuditIssue {
  id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  detail: string;
  sourceId?: string;
}

export interface RealityDataAuditResult {
  status: "PASS" | "WARN" | "CRITICAL";
  totalSources: number;
  staleCount: number;
  noSourceDate: number;
  fictionalLikeRealCount: number;
  demoLikeRealCount: number;
  rulesChecked: number;
  issues: RealityDataAuditIssue[];
  generatedAt: string;
}

export function runRealityDataAudit(): RealityDataAuditResult {
  const sources = listExternalDataSources();
  const freshness = detectAllFreshness();
  const scores = scoreAll();
  const noise = detectAllNoise();
  const issues: RealityDataAuditIssue[] = [];

  freshness.forEach((f) => {
    if (f.freshnessLevel === "STALE") issues.push({ id: `STALE_${f.sourceId}`, severity: "MEDIUM", title: "数据过期", detail: f.staleReason ?? "stale", sourceId: f.sourceId });
    if (f.freshnessLevel === "UNKNOWN") issues.push({ id: `NO_DATE_${f.sourceId}`, severity: "LOW", title: "缺少数据日期", detail: "建议补充 dataDate。", sourceId: f.sourceId });
  });
  scores.forEach((s) => {
    if (s.score < 0.3) issues.push({ id: `LOW_CRED_${s.sourceId}`, severity: "MEDIUM", title: "可信度偏低", detail: s.risks.join("; ") || "score < 0.3", sourceId: s.sourceId });
  });
  noise.forEach((n) => {
    if (n.noiseLevel === "HIGH") issues.push({ id: `NOISE_${n.sourceId}`, severity: "MEDIUM", title: "高噪音风险", detail: n.noiseTypes.join(", "), sourceId: n.sourceId });
  });

  const staleCount = freshness.filter((f) => f.freshnessLevel === "STALE").length;
  const noSourceDate = sources.filter((s) => !s.dataDate).length;
  const fictionalLikeRealCount = sources.filter((s) => s.sourceType === "FICTIONAL_WORLD_DATA" && s.allowedUseCases.includes("现实证据")).length;
  const demoLikeRealCount = sources.filter((s) => s.sourceType === "DEMO_DATA" && s.allowedUseCases.includes("Real")).length;
  if (fictionalLikeRealCount > 0) issues.push({ id: "FICTIONAL_AS_REAL", severity: "CRITICAL", title: "虚构数据被允许作为现实证据", detail: "违反 RD_NO_FICTIONAL_AS_REAL。" });
  if (demoLikeRealCount > 0) issues.push({ id: "DEMO_AS_REAL", severity: "CRITICAL", title: "Demo 数据被允许作为 Real 证据", detail: "违反 RD_NO_DEMO_AS_REAL。" });

  const hasCritical = issues.some((i) => i.severity === "CRITICAL");
  const hasWarn = issues.some((i) => i.severity === "HIGH" || i.severity === "MEDIUM");
  const status: RealityDataAuditResult["status"] = hasCritical ? "CRITICAL" : hasWarn ? "WARN" : "PASS";

  return {
    status,
    totalSources: sources.length,
    staleCount,
    noSourceDate,
    fictionalLikeRealCount,
    demoLikeRealCount,
    rulesChecked: REALITY_DATA_SAFETY_RULES.length,
    issues,
    generatedAt: new Date().toISOString(),
  };
}
