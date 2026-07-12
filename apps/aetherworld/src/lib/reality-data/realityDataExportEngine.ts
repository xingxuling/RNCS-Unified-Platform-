import { listExternalDataSources } from "./externalDataSourceRegistry";
import { scoreAll } from "./sourceCredibilityScorer";
import { detectAll as detectAllFreshness } from "./dataFreshnessDetector";
import { runRealityDataAudit } from "./realityDataAuditEngine";

export type RealityExportFormat = "json" | "markdown";

export function exportRealityData(format: RealityExportFormat = "json"): string {
  const payload = {
    generatedAt: new Date().toISOString(),
    sources: listExternalDataSources(),
    credibility: scoreAll(),
    freshness: detectAllFreshness(),
    audit: runRealityDataAudit(),
  };
  if (format === "json") return JSON.stringify(payload, null, 2);
  const lines: string[] = [`# Reality Data Export`, `生成时间：${payload.generatedAt}`, ``, `## Sources (${payload.sources.length})`];
  payload.sources.forEach((s) => lines.push(`- **${s.sourceName}** (${s.sourceType}) · credibility=${s.credibilityLevel} · privacy=${s.privacyLevel}`));
  lines.push(``, `## Audit`, `状态：${payload.audit.status}`, `Issue 数：${payload.audit.issues.length}`);
  return lines.join("\n");
}
