import { detectAll as detectAllFreshness } from "./dataFreshnessDetector";
import { listExternalDataSources } from "./externalDataSourceRegistry";

export type RecalculationTrigger =
  | "RECALC_REALITY_CALIBRATION" | "RECALC_SOURCE_CREDIBILITY" | "RECALC_DATA_FRESHNESS"
  | "RECALC_EVIDENCE_MAPPING" | "RECALC_REALITY_VARIABLES" | "RECALC_CALIBRATION_PLAN"
  | "RECALC_REALITY_DATA_AUDIT";

export interface RecalculationBridgeResult {
  triggers: RecalculationTrigger[];
  staleSourceIds: string[];
  reasons: string[];
}

export function collectRecalculationTriggers(opts?: {
  subjectModeChanged?: boolean;
  constantUniverseChanged?: boolean;
  constitutionChanged?: boolean;
  newSourceAdded?: boolean;
}): RecalculationBridgeResult {
  const triggers = new Set<RecalculationTrigger>();
  const reasons: string[] = [];
  const fresh = detectAllFreshness();
  const stale = fresh.filter((f) => f.freshnessLevel === "STALE" || f.freshnessLevel === "AGING").map((f) => f.sourceId);
  if (stale.length) { triggers.add("RECALC_DATA_FRESHNESS"); triggers.add("RECALC_REALITY_CALIBRATION"); reasons.push(`检测到 ${stale.length} 个 stale/aging 源。`); }
  if (opts?.newSourceAdded) { triggers.add("RECALC_SOURCE_CREDIBILITY"); triggers.add("RECALC_EVIDENCE_MAPPING"); reasons.push("新源接入。"); }
  if (opts?.subjectModeChanged) { triggers.add("RECALC_CALIBRATION_PLAN"); reasons.push("主体模式切换。"); }
  if (opts?.constantUniverseChanged) { triggers.add("RECALC_REALITY_CALIBRATION"); triggers.add("RECALC_REALITY_DATA_AUDIT"); reasons.push("常数宇宙更新。"); }
  if (opts?.constitutionChanged) { triggers.add("RECALC_REALITY_DATA_AUDIT"); reasons.push("系统宪法更新。"); }
  if (listExternalDataSources().length === 0) reasons.push("尚无任何外部数据源。");
  return { triggers: [...triggers], staleSourceIds: stale, reasons };
}
