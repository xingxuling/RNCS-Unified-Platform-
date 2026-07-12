// 预测准确率计算器
// 输入：回验记录数组（基于现有 FeedbackRecord 结构）
// 输出：分层准确率 + 样本分层 + 是否允许公开声明

import type { FeedbackRecord } from "./types";
import {
  ACCURACY_DIMENSIONS,
  ACCURACY_TARGET,
  PUBLIC_CLAIM_RULES,
  SAMPLE_TIERS,
  TIMING_WINDOW_LABEL,
  type AccuracyDimensionId,
  type TimingWindow,
} from "@/constants/accuracyMetrics";

export type SampleTier = "insufficient" | "early" | "ready";

export interface DimensionStat {
  id: AccuracyDimensionId;
  rate: number;          // 0-100
  hit: number;
  total: number;
}

export interface AccuracyReport {
  totalRecords: number;
  validRecords: number;
  dimensions: Record<AccuracyDimensionId, DimensionStat>;
  overall: number;       // 综合有效率 0-100
  sampleTier: SampleTier;
  canClaimPublicly: boolean;
  target: { min: number; max: number; label: string };
  gapToTarget: number;   // 与 93% 的差距（负数代表未达到）
  trend?: { date: string; rate: number }[]; // 滚动窗口趋势（仅当样本充足）
}

/** 把回验记录归类到 timing window — 当前仅有 hit/intensity/typeMatched 等基础字段，
 *  使用启发式：hit 且 hitScore ≥ 85 -> exact_day，65-85 -> within_3，50-65 -> within_7，
 *  intensityMatched 且 typeMatched -> same_week，仅 typeMatched -> same_month，否则 miss */
function inferTimingWindow(r: FeedbackRecord): TimingWindow {
  if (r.hit && r.hitScore >= 85) return "exact_day";
  if (r.hit && r.hitScore >= 65) return "within_3";
  if (r.hit && r.hitScore >= 50) return "within_7";
  if (r.intensityMatched && r.typeMatched) return "same_week";
  if (r.typeMatched) return "same_month";
  return "miss";
}

function dimensionStat(id: AccuracyDimensionId, hit: number, total: number): DimensionStat {
  return { id, hit, total, rate: total === 0 ? 0 : Math.round((hit / total) * 100) };
}

export function calculateAccuracy(records: FeedbackRecord[]): AccuracyReport {
  const total = records.length;
  // 有效回验：至少包含命中状态字段（默认全部记录都算有效，除非完全空）
  const valid = records.filter((r) => r.date && (r.hit || !r.hit));

  // 方向：actionWorked
  const direction = dimensionStat(
    "direction",
    valid.filter((r) => r.actionWorked).length,
    valid.length,
  );
  // 事件类型：typeMatched
  const eventType = dimensionStat(
    "event_type",
    valid.filter((r) => r.typeMatched).length,
    valid.length,
  );
  // 时间窗口：归类后按 ±7 内视为命中
  const timingHits = valid.filter((r) => {
    const w = inferTimingWindow(r);
    return w === "exact_day" || w === "within_3" || w === "within_7";
  }).length;
  const timing = dimensionStat("timing_window", timingHits, valid.length);
  // 行动许可：actionWorked 且 hit
  const action = dimensionStat(
    "action_permission",
    valid.filter((r) => r.actionWorked && r.hit).length,
    valid.length,
  );
  // 定数：hit 且 intensityMatched
  const determination = dimensionStat(
    "determination",
    valid.filter((r) => r.hit && r.intensityMatched).length,
    valid.length,
  );

  // 综合：按 ACCURACY_DIMENSIONS 权重合成
  const weighted =
    direction.rate * 0.3 +
    eventType.rate * 0.2 +
    timing.rate * 0.2 +
    action.rate * 0.15 +
    determination.rate * 0.15;
  const overall = valid.length === 0 ? 0 : Math.round(weighted);

  const dims: Record<AccuracyDimensionId, DimensionStat> = {
    direction,
    event_type: eventType,
    timing_window: timing,
    action_permission: action,
    determination,
    overall: dimensionStat("overall", 0, valid.length),
  };
  dims.overall.rate = overall;
  dims.overall.hit = Math.round((overall / 100) * valid.length);

  const sampleTier: SampleTier =
    valid.length < SAMPLE_TIERS.insufficient
      ? "insufficient"
      : valid.length < SAMPLE_TIERS.early
        ? "early"
        : "ready";

  const canClaimPublicly =
    valid.length >= PUBLIC_CLAIM_RULES.minSamples &&
    overall >= PUBLIC_CLAIM_RULES.minOverallRate;

  const gapToTarget = overall - ACCURACY_TARGET.min;

  // 简易趋势：按日期排序后，每 10 条滑动平均
  let trend: { date: string; rate: number }[] | undefined;
  if (valid.length >= SAMPLE_TIERS.early) {
    const sorted = [...valid].sort((a, b) => a.date.localeCompare(b.date));
    const window = 10;
    trend = [];
    for (let i = window; i <= sorted.length; i += Math.max(1, Math.floor(sorted.length / 20))) {
      const slice = sorted.slice(Math.max(0, i - window), i);
      const r = calculateAccuracy(slice).overall;
      trend.push({ date: sorted[i - 1].date, rate: r });
    }
  }

  return {
    totalRecords: total,
    validRecords: valid.length,
    dimensions: dims,
    overall,
    sampleTier,
    canClaimPublicly,
    target: { min: ACCURACY_TARGET.min, max: ACCURACY_TARGET.max, label: ACCURACY_TARGET.label },
    gapToTarget,
    trend,
  };
}

/** 用于 UI 提示文案 */
export function sampleTierMessage(tier: SampleTier): string {
  if (tier === "insufficient") return "样本不足，准确率仅供参考。";
  if (tier === "early") return "早期内测样本，仍需继续校准。";
  return "样本量充足，可展示趋势曲线。";
}

export { TIMING_WINDOW_LABEL };
