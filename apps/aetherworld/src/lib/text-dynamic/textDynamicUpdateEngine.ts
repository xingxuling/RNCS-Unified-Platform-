// Text Dynamic Update Engine — top-level façade (see spec §0, §25)
import type { TextTriggerType } from "@/constants/text-dynamic/textTriggerTypes";
import { detectTextImpact, getLastDetection } from "./textChangeDetector";
import { runStaleDetection } from "./textStaleDetector";
import { runTextAudit } from "./textAuditEngine";
import { reviewStale } from "./textReviewEngine";
import { generateBatch, type TextGenerationOutput } from "./textGenerationEngine";
import { TEXT_REGISTRY, getRegistrySummary } from "./textRegistry";
import { currentVersion, listVersions } from "./textVersioningEngine";
import { localizationSummary, markStaleAfterSourceChange } from "./textLocalizationSyncEngine";

export function textDynamicMeta() {
  return {
    engineName: "Text Dynamic Update Detection & Generation Engine",
    engineChineseName: "文本动态更新检测生成引擎",
    version: currentVersion().version,
    docsVersion: "v1.0",
  };
}

export function getTextDynamicSummary() {
  const reg = getRegistrySummary();
  const stale = TEXT_REGISTRY.filter((x) => x.stale).length;
  const audit = runTextAudit();
  const loc = localizationSummary();
  const localizationStaleCount = Object.values(loc).reduce((acc, x) => acc + x.stale, 0);
  const review = reviewStale();
  const pendingReviewCount = review.filter((r) => r.status !== "AUTO_APPROVED").length;
  return {
    totalTextEntries: reg.total,
    staleTextCount: stale,
    criticalTextIssues: audit.summary.critical,
    localizationStaleCount,
    pendingReviewCount,
    currentTextVersion: currentVersion().version,
    auditStatus: audit.status,
    byAudience: reg.byAudience,
    byScope: reg.byScope,
    versions: listVersions().length,
    lastDetection: getLastDetection(),
  };
}

export function runDetectAndGenerate(triggerType: TextTriggerType, opts?: { affectedModuleIds?: string[] }): { detection: ReturnType<typeof detectTextImpact>; candidates: TextGenerationOutput[] } {
  const detection = detectTextImpact({ triggerType, affectedModuleIds: opts?.affectedModuleIds });
  markStaleAfterSourceChange(detection.impact.affectedTextIds);
  const candidates = generateBatch(detection.impact.affectedTextIds);
  return { detection, candidates };
}

export function runFullStaleSweep() {
  return runStaleDetection();
}

export function runFullTextAudit() {
  return runTextAudit();
}
