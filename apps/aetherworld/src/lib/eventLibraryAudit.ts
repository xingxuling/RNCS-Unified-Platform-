// 事件库总审计 — 聚合去重 / 缺口 / 字段补全 / 合并建议 / 健康分
import { EVENT_ALGORITHMS } from "@/constants/eventAlgorithmTypes";
import { analyzeDimensionGaps, unmappedExistingDimensions, type GapAnalysisResult } from "./eventGapAnalyzer";
import {
  detectDuplicateClusters,
  primaryEventIdOf,
  type EventDuplicateCluster,
} from "./eventDeduplicationEngine";
import {
  aggregateCompletion,
  buildAllCompletionReports,
  type CompletionAggregate,
  type EventCompletionReport,
} from "./eventCompletionEngine";
import { buildMergeSuggestions, type MergeSuggestion } from "./eventMergeSuggestionEngine";
import { EVENT_DIMENSION_TARGETS } from "@/constants/eventDimensionTargets";

export interface EventLibraryAuditResult {
  totalEvents: number;
  uniqueEvents: number;
  duplicateClusters: EventDuplicateCluster[];
  parentChildClusters: EventDuplicateCluster[];
  gap: GapAnalysisResult;
  completionReports: EventCompletionReport[];
  completion: CompletionAggregate;
  mergeSuggestions: MergeSuggestion[];
  unmappedDimensions: string[];
  /** 0-100 */
  eventLibraryHealthScore: number;
  recommendedActions: string[];
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function auditEventLibrary(): EventLibraryAuditResult {
  const total = EVENT_ALGORITHMS.length;

  const clustersAll = detectDuplicateClusters();
  const duplicateClusters = clustersAll.filter((c) => c.duplicateType !== "PARENT_CHILD");
  const parentChildClusters = clustersAll.filter((c) => c.duplicateType === "PARENT_CHILD");

  // 唯一事件：每事件映射到 primary，去重后数量
  const uniqueSet = new Set<string>();
  EVENT_ALGORITHMS.forEach((e) => uniqueSet.add(primaryEventIdOf(e.id)));
  const unique = uniqueSet.size;

  const gap = analyzeDimensionGaps();
  const reports = buildAllCompletionReports();
  const completion = aggregateCompletion(reports);
  const mergeSuggestions = buildMergeSuggestions();
  const unmapped = unmappedExistingDimensions();

  // 健康分（log-scaled）：
  // 分子：维度覆盖 × 唯一比例 × 字段覆盖
  // 分母：重复密度 × 缺字段密度 × 维度缺口
  const dimensionsCovered = gap.coverage.filter((c) => c.status === "OK" || c.status === "OVERFLOW").length;
  const dimensionCoverage = dimensionsCovered / EVENT_DIMENSION_TARGETS.length;          // 0-1
  const uniqueRatio = total === 0 ? 0 : unique / total;
  const userLangCoverage = 1 - completion.missingUserLanguageCount / Math.max(1, total);
  const manifestationCoverage = 1 - completion.missingManifestationCount / Math.max(1, total);
  const validationCoverage = 1 - completion.missingValidationCount / Math.max(1, total);
  const actionMappingCoverage = 1 - completion.missingActionMappingCount / Math.max(1, total);
  const falseSignalCoverage = 1 - completion.missingFalseSignalsCount / Math.max(1, total);

  const duplicateDensity = duplicateClusters.length / Math.max(1, total);  // 越低越好
  const orphanRatio = unmapped.length / Math.max(1, EVENT_DIMENSION_TARGETS.length);
  const missingFieldsDensity = (100 - completion.averageCompleteness) / 100;
  const gapPressure = (gap.missingDimensions.length + gap.weakDimensions.length) / EVENT_DIMENSION_TARGETS.length;

  const num =
    (dimensionCoverage + 0.1) *
    (uniqueRatio + 0.1) *
    (userLangCoverage + 0.1) *
    (manifestationCoverage + 0.1) *
    (validationCoverage + 0.1) *
    (actionMappingCoverage + 0.1) *
    (falseSignalCoverage + 0.1);
  const den =
    (duplicateDensity + 0.1) *
    (orphanRatio + 0.1) *
    (missingFieldsDensity + 0.1) *
    (gapPressure + 0.1);
  const raw = Math.log10(num / den + 1) * 25;
  const eventLibraryHealthScore = clamp(Math.round(raw), 0, 100);

  // 推荐动作
  const recommendedActions: string[] = [];
  if (duplicateClusters.length > 0) {
    recommendedActions.push(`处理 ${duplicateClusters.length} 个重复/近义事件簇（优先 alias / merge fields，不删除旧 eventId）。`);
  }
  if (completion.missingUserLanguageCount > 0) {
    recommendedActions.push(`为 ${completion.missingUserLanguageCount} 个事件补 userFriendlyName（接入产品–用户语言计算法）。`);
  }
  if (completion.missingFalseSignalsCount > 0) {
    recommendedActions.push(`为 ${completion.missingFalseSignalsCount} 个事件补 falseManifestations（伪信号/噪声）。`);
  }
  if (completion.missingValidationCount > 0) {
    recommendedActions.push(`为 ${completion.missingValidationCount} 个事件补 validationSignals（回验指标）。`);
  }
  if (gap.weakDimensions.length > 0) {
    recommendedActions.push(`补强弱维度：${gap.weakDimensions.join(", ")}。`);
  }
  if (gap.overflowDimensions.length > 0) {
    recommendedActions.push(`聚合 / 父子化超出上限的维度：${gap.overflowDimensions.join(", ")}。`);
  }
  if (gap.missingDimensions.length > 0) {
    recommendedActions.push(`补全完全缺失的维度：${gap.missingDimensions.join(", ")}。`);
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push("事件库结构健康，建议继续按字段补全 + 回验权重学习。");
  }

  return {
    totalEvents: total,
    uniqueEvents: unique,
    duplicateClusters,
    parentChildClusters,
    gap,
    completionReports: reports,
    completion,
    mergeSuggestions,
    unmappedDimensions: unmapped,
    eventLibraryHealthScore,
    recommendedActions,
  };
}

/** 生成 Lovable 补全提示词 */
export function generateCompletionPrompt(audit: EventLibraryAuditResult): string {
  const lines: string[] = [];
  lines.push("# Lovable 事件库补全提示词 · Event Library Completion Prompt");
  lines.push("");
  lines.push("## 核心约束");
  lines.push("- 不要新增与已有事件相似度 ≥ 0.85 的事件。");
  lines.push("- 不要将事件「阶段」或「表现形式」误新增为事件类型。");
  lines.push("- 不要破坏已有 eventId；合并通过 alias / mergedInto / deprecated 字段。");
  lines.push("- 旧回验记录使用 deprecated eventId 时应保留并归并到 primary event。");
  lines.push("");
  lines.push("## 当前事件库状态");
  lines.push(`- 总事件数：${audit.totalEvents}`);
  lines.push(`- 唯一事件数：${audit.uniqueEvents}`);
  lines.push(`- 健康分：${audit.eventLibraryHealthScore}/100`);
  lines.push(`- 重复簇：${audit.duplicateClusters.length}`);
  lines.push(`- 平均字段完整度：${audit.completion.averageCompleteness}%`);
  lines.push("");
  if (audit.gap.weakDimensions.length > 0 || audit.gap.missingDimensions.length > 0) {
    lines.push("## 需要补事件的维度（仅补到目标下限即可，不要堆砌）");
    audit.gap.coverage
      .filter((c) => c.status === "WEAK" || c.status === "MISSING")
      .forEach((c) => lines.push(`- ${c.name}（${c.en}）：当前 ${c.currentCount}，目标 ${c.minCount}–${c.maxCount}`));
    lines.push("");
  }
  if (audit.completion.missingUserLanguageCount > 0) {
    lines.push(`## 仅需补字段（不要新增事件）`);
    lines.push(`- ${audit.completion.missingUserLanguageCount} 个事件缺 userFriendlyName`);
    lines.push(`- ${audit.completion.missingFalseSignalsCount} 个事件缺 falseManifestations`);
    lines.push(`- ${audit.completion.missingValidationCount} 个事件缺 validationSignals`);
    lines.push("");
  }
  if (audit.mergeSuggestions.length > 0) {
    lines.push("## 需要合并 / Alias 的事件簇");
    audit.mergeSuggestions.slice(0, 10).forEach((m) => {
      lines.push(`- [${m.duplicateType}] ${m.otherNames.join(", ")} → ${m.primaryName} (${m.strategy})`);
    });
    lines.push("");
  }
  lines.push("## 输出要求");
  lines.push("- 仅输出字段补全/合并方案，不输出新事件 ID。");
  lines.push("- 所有补全必须可被 Prediction Detail / Calendar / Feedback / Prompt Forge 消费。");
  return lines.join("\n");
}
