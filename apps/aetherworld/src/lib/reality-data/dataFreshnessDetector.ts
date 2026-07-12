import type { ExternalDataSource } from "./externalDataSourceRegistry";
import { listExternalDataSources } from "./externalDataSourceRegistry";
import type { DataFreshnessLevel } from "@/constants/reality-data/dataFreshnessLevels";

export interface FreshnessResult {
  sourceId: string;
  dataDate?: string;
  checkedAt: string;
  freshnessLevel: DataFreshnessLevel;
  staleReason?: string;
  recommendedAction?: string;
}

const WINDOWS: Record<string, number> = { REAL_TIME: 1, HIGH: 30, MEDIUM: 90, LOW: 365 };

export function detectFreshness(source: ExternalDataSource): FreshnessResult {
  const checkedAt = new Date().toISOString();
  if (!source.dataDate) {
    return { sourceId: source.sourceId, checkedAt, freshnessLevel: "UNKNOWN", staleReason: "缺少数据日期", recommendedAction: "补充 dataDate。" };
  }
  const days = (Date.now() - new Date(source.dataDate).getTime()) / 86400000;
  const window = WINDOWS[source.freshnessRequirement] ?? 90;
  let level: DataFreshnessLevel = "FRESH";
  if (days > window * 2) level = "STALE";
  else if (days > window) level = "AGING";
  else if (days > window * 0.5) level = "RECENT";
  const staleReason = level === "STALE" || level === "AGING" ? `已超过 ${window} 天窗口（实际 ${Math.round(days)} 天）。` : undefined;
  return { sourceId: source.sourceId, dataDate: source.dataDate, checkedAt, freshnessLevel: level, staleReason, recommendedAction: staleReason ? "建议刷新数据并触发重算。" : undefined };
}

export function detectAll(): FreshnessResult[] {
  return listExternalDataSources().map(detectFreshness);
}
