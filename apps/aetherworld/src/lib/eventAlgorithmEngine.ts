// 事件算法引擎 — 给定维度 + 触发结果，选出主/副/风险事件
import type { TriggerResult } from "./predictionEngine";
import type { DimensionResult } from "./predictionDimensionEngine";
import {
  EVENT_ALGORITHMS, type EventAlgorithm, getEventsByDimension,
} from "@/constants/eventAlgorithmTypes";

export interface EventCandidate {
  event: EventAlgorithm;
  score: number;           // 0-100
  rationale: string;
  riskFlag: boolean;
}

export interface EventSelection {
  primary: EventCandidate;
  secondary: EventCandidate[];
  risk: EventCandidate | null;
  background: EventCandidate[];
  all: EventCandidate[];
}

interface Context {
  trigger: TriggerResult;
  dimensionPrimary: DimensionResult;
  dimensionSecondary: DimensionResult[];
  /** 0-100；可由定数引擎传入 */
  determinationScore?: number;
  /** 0-100 */
  branchCollapseScore?: number;
  /** 0-100 */
  signalQuality?: number;
  feedbackWeight?: number;
  noise?: number;
}

export function selectEvents(ctx: Context): EventSelection {
  const {
    trigger, dimensionPrimary, dimensionSecondary,
    determinationScore = 55, branchCollapseScore = 50,
    signalQuality = 70, feedbackWeight = 50, noise = Math.min(40, (trigger.noiseCandidates?.length ?? 0) * 12),
  } = ctx;

  const dimSet = new Map<string, number>();
  dimSet.set(dimensionPrimary.dimensionId, dimensionPrimary.dimensionWeight);
  dimensionSecondary.forEach((d) => dimSet.set(d.dimensionId, d.dimensionWeight));

  const candidates: EventCandidate[] = EVENT_ALGORITHMS.map((ev) => {
    const dimWeight = dimSet.get(ev.dimensionId) ?? 20;
    // 公式：DimensionWeight × Trigger × Determination × BranchCollapse × SignalQuality × Feedback ÷ Noise
    const polarityBoost =
      ev.positiveOrNegative === "POSITIVE" ? 1.0 :
      ev.positiveOrNegative === "MIXED" ? 0.9 :
      ev.positiveOrNegative === "NEUTRAL" ? 0.7 : 0.85; // NEGATIVE 略低，除非噪声/压力高
    const negativeBoost = ev.positiveOrNegative === "NEGATIVE" && noise > 20 ? 1 + (noise - 20) / 50 : 1;

    const numer = dimWeight * 0.5
      + trigger.score * 0.3
      + determinationScore * 0.15
      + branchCollapseScore * 0.1
      + signalQuality * 0.1
      + feedbackWeight * 0.05;

    const denom = 1 + noise / 100;
    const raw = (numer / denom) * polarityBoost * negativeBoost;
    const score = Math.max(0, Math.min(100, Math.round(raw)));

    const riskFlag = ev.positiveOrNegative === "NEGATIVE" || ev.id === "FALSE_SIGNAL_EVENT";

    const rationale = [
      `维度权重 ${dimWeight}`,
      `触发 ${trigger.score}`,
      `定数 ${determinationScore}`,
      noise > 0 ? `噪声 ${noise}` : null,
    ].filter(Boolean).join(" · ");

    return { event: ev, score, rationale, riskFlag };
  });

  candidates.sort((a, b) => b.score - a.score);

  const primary = candidates.find((c) => !c.riskFlag) ?? candidates[0];
  const secondary = candidates
    .filter((c) => c.event.id !== primary.event.id && !c.riskFlag)
    .slice(0, 2);
  const risk = candidates.find((c) => c.riskFlag) ?? null;
  const background = candidates
    .filter((c) => c.event.id !== primary.event.id
      && !secondary.some((s) => s.event.id === c.event.id)
      && (!risk || c.event.id !== risk.event.id))
    .slice(0, 4);

  return { primary, secondary, risk, background, all: candidates };
}

export { getEventsByDimension };
