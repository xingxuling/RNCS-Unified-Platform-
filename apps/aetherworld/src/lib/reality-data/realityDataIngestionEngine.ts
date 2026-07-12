import type { ExternalDataSource } from "./externalDataSourceRegistry";
import { getExternalDataSource, registerExternalDataSource } from "./externalDataSourceRegistry";
import type { DataSourceType } from "@/constants/reality-data/dataSourceTypes";
import { DATA_SOURCE_TYPES } from "@/constants/reality-data/dataSourceTypes";

export interface RealityDataIngestionInput {
  sourceName: string;
  sourceType: DataSourceType;
  content: string;
  url?: string;
  dataDate?: string;
  provider?: string;
  privacyLevel?: ExternalDataSource["privacyLevel"];
}

export interface RealityDataIngestionResult {
  sourceId: string;
  accepted: boolean;
  reason?: string;
  source?: ExternalDataSource;
  extractedHints: string[];
}

export function ingestRealityData(input: RealityDataIngestionInput): RealityDataIngestionResult {
  const meta = DATA_SOURCE_TYPES.find((t) => t.id === input.sourceType);
  if (!meta) return { sourceId: "", accepted: false, reason: "未知数据源类型", extractedHints: [] };
  const sourceId = `ingested_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const source: ExternalDataSource = {
    sourceId,
    sourceName: input.sourceName || meta.label,
    sourceType: input.sourceType,
    url: input.url,
    provider: input.provider,
    accessMethod: input.sourceType === "USER_PROVIDED" ? "MANUAL" : input.url ? "WEB" : "INTERNAL",
    credibilityLevel: meta.canBeRealEvidence ? "MEDIUM" : "UNKNOWN",
    freshnessRequirement: "MEDIUM",
    allowedUseCases: meta.canBeRealEvidence ? ["校准", "证据"] : ["创作"],
    forbiddenUseCases: meta.canBeRealEvidence ? [] : ["现实证据"],
    privacyLevel: input.privacyLevel ?? (input.sourceType === "PERSONAL_LOCAL_DATA" ? "USER_PRIVATE" : "PUBLIC"),
    lastCheckedAt: new Date().toISOString(),
    dataDate: input.dataDate,
    notes: [`通过 ingestion 接入，content 长度 ${input.content.length}`],
  };
  registerExternalDataSource(source);
  const hints: string[] = [];
  if (/\b20\d{2}\b/.test(input.content)) hints.push("内容包含年份。");
  if (/排名|ranking|榜单/i.test(input.content)) hints.push("包含排名信息。");
  if (/政策|policy/i.test(input.content)) hints.push("包含政策信息。");
  if (/价格|price|\$|￥/.test(input.content)) hints.push("包含价格信息。");
  return { sourceId, accepted: true, source, extractedHints: hints };
}

export function reingest(sourceId: string): RealityDataIngestionResult {
  const existing = getExternalDataSource(sourceId);
  if (!existing) return { sourceId, accepted: false, reason: "未找到", extractedHints: [] };
  existing.lastCheckedAt = new Date().toISOString();
  registerExternalDataSource(existing);
  return { sourceId, accepted: true, source: existing, extractedHints: ["重新检查时间已更新。"] };
}
