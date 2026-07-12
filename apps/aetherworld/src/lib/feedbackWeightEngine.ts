// 回验权重计算引擎 Feedback Weight Engine
// 每一次用户回验反向影响未来预测中各引擎权重
import { clamp } from "./math";
import { DEFAULT_ENGINE_WEIGHTS, ENGINE_WEIGHTS, evolutionBand } from "@/constants/feedbackWeightFactors";
import { FEEDBACK_BIAS_TYPES, type FeedbackBiasType } from "@/constants/feedbackBiasTypes";
import type { FeedbackRecord } from "./types";
import { DETERMINATION_STATES, type DeterminationStatus } from "@/constants/determinationStates";

// 扩展回验记录字段（增量、可选，不破坏旧记录）
export interface FeedbackExtended {
  predictedEventType?: string;
  actualEventType?: string;
  predictedStrength?: number;
  actualStrength?: number;
  predictedActionPermission?: string;
  actionTaken?: string;
  actionWasUseful?: boolean;
  hitAccuracy?: number;
  eventTypeMatch?: number;
  timingAccuracy?: number;
  actionValidity?: number;
  signalQualityAtPrediction?: number;
  determinationStateAtPrediction?: DeterminationStatus;
  determinationScoreAtPrediction?: number;
  regionProfile?: string;
  regionalUXFit?: number;
  noiseInfluence?: number;
  userActionDistortion?: number;
  missingVariablePenalty?: number;
  biasTypes?: FeedbackBiasType[];
  systemCorrectionNote?: string;
}

export type EnrichedFeedback = FeedbackRecord & FeedbackExtended;

// ============= 权重状态 =============

export interface SubjectWeightState {
  subjectId: string;
  engineWeights: Record<string, number>;            // 归一化到 1.0
  numberConstantWeights: Record<string, number>;    // 0-9
  eventTypeWeights: Record<string, number>;
  actionPermissionWeights: Record<string, number>;
  determinationReliability: Record<DeterminationStatus, { hits: number; total: number }>;
  biasCounts: Partial<Record<FeedbackBiasType, number>>;
  history: WeightChangeEvent[];
  lastUpdated: string;
}

export interface WeightChangeEvent {
  date: string;
  feedbackDate: string;
  biasTypes: FeedbackBiasType[];
  adjustments: Array<{ engine: string; delta: number; before: number; after: number }>;
  note: string;
  hit: boolean;
  evolutionScoreAfter: number;
}

export function createInitialWeightState(subjectId: string): SubjectWeightState {
  return {
    subjectId,
    engineWeights: { ...DEFAULT_ENGINE_WEIGHTS },
    numberConstantWeights: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [String(i), 1])),
    eventTypeWeights: {},
    actionPermissionWeights: {},
    determinationReliability: {
      UNDETERMINED: { hits: 0, total: 0 },
      SEMI_DETERMINED: { hits: 0, total: 0 },
      NEAR_DETERMINED: { hits: 0, total: 0 },
      DETERMINED: { hits: 0, total: 0 },
      REVERSE_DETERMINED: { hits: 0, total: 0 },
      FALSE_DETERMINED: { hits: 0, total: 0 },
    },
    biasCounts: {},
    history: [],
    lastUpdated: new Date().toISOString(),
  };
}

// ============= 单次回验权重修正 =============

export interface ApplyResult {
  state: SubjectWeightState;
  event: WeightChangeEvent;
  summary: string;
}

export function applyFeedback(
  prev: SubjectWeightState,
  record: EnrichedFeedback,
): ApplyResult {
  const state: SubjectWeightState = structuredClone(prev);

  const biasTypes = record.biasTypes ?? inferBiasTypes(record);
  const adjustments: WeightChangeEvent["adjustments"] = [];

  // 1. 命中加权
  if (record.hit) {
    bump(state.engineWeights, "signalPurification", +2, adjustments);
    bump(state.engineWeights, "branchCollapse",    +2, adjustments);
    bump(state.engineWeights, "determinantNumber", +1, adjustments);
  }

  // 2. 偏差调整
  for (const bt of biasTypes) {
    state.biasCounts[bt] = (state.biasCounts[bt] ?? 0) + 1;
    const meta = FEEDBACK_BIAS_TYPES[bt];
    for (const [engine, delta] of Object.entries(meta.adjustments)) {
      bump(state.engineWeights, engine, delta, adjustments);
    }
  }

  // 3. 定数可靠度更新
  const dState = record.determinationStateAtPrediction;
  if (dState && state.determinationReliability[dState]) {
    state.determinationReliability[dState].total += 1;
    if (record.hit) state.determinationReliability[dState].hits += 1;
  }

  // 4. 事件类型权重
  if (record.actualEventType) {
    const cur = state.eventTypeWeights[record.actualEventType] ?? 1;
    const delta = record.hit ? 0.05 : -0.03;
    state.eventTypeWeights[record.actualEventType] = +clamp(cur + delta, 0.3, 2.5).toFixed(3);
  }

  // 5. 行动许可
  if (record.predictedActionPermission) {
    const k = record.predictedActionPermission;
    const cur = state.actionPermissionWeights[k] ?? 1;
    const delta = record.actionWasUseful ? 0.05 : -0.04;
    state.actionPermissionWeights[k] = +clamp(cur + delta, 0.3, 2.5).toFixed(3);
  }

  // 归一化引擎权重，使之和=1
  normalizeWeights(state.engineWeights);

  const evolutionScore = computeEvolutionScore(state, []);
  const note = composeCorrectionNote(record, biasTypes);

  const event: WeightChangeEvent = {
    date: new Date().toISOString(),
    feedbackDate: record.date,
    biasTypes,
    adjustments,
    note,
    hit: record.hit,
    evolutionScoreAfter: evolutionScore,
  };
  state.history = [event, ...state.history].slice(0, 60);
  state.lastUpdated = event.date;

  return { state, event, summary: note };
}

function bump(
  weights: Record<string, number>,
  key: string,
  deltaPct: number,
  log: WeightChangeEvent["adjustments"],
) {
  if (!(key in weights)) return;
  const before = weights[key];
  const after = +clamp(before + deltaPct / 100, 0.01, 0.4).toFixed(4);
  weights[key] = after;
  log.push({ engine: key, delta: +(after - before).toFixed(4), before, after });
}

function normalizeWeights(weights: Record<string, number>) {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (sum <= 0) return;
  for (const k of Object.keys(weights)) {
    weights[k] = +(weights[k] / sum).toFixed(4);
  }
}

// ============= 偏差类型自动推断 =============

export function inferBiasTypes(r: EnrichedFeedback): FeedbackBiasType[] {
  const out: FeedbackBiasType[] = [];
  const ps = r.predictedStrength ?? 0;
  const as_ = r.actualStrength ?? 0;
  if (ps > 0 && as_ > 0) {
    if (ps - as_ >= 25) out.push("OVER_PREDICTED");
    if (as_ - ps >= 25) out.push("UNDER_PREDICTED");
  }
  if (r.eventTypeMatch !== undefined && r.eventTypeMatch < 40 && r.hit) out.push("EVENT_TYPE_DRIFT");
  if (r.timingAccuracy !== undefined && r.timingAccuracy < 50) out.push("TIME_DELAYED");
  if ((r.noiseInfluence ?? 0) >= 60) out.push("SIGNAL_NOISE");
  if ((r.missingVariablePenalty ?? 0) >= 50) out.push("HUMAN_VARIABLE_MISSING");
  if ((r.userActionDistortion ?? 0) >= 60) out.push("ACTION_CHANGED_OUTCOME");
  if (r.noise && r.noise.length) {
    if (r.noise.some((n) => n.includes("延"))) out.push("TIME_DELAYED");
    if (r.noise.some((n) => n.includes("提前"))) out.push("TIME_EARLY");
    if (r.noise.some((n) => n.includes("噪") || n.includes("情绪"))) out.push("SIGNAL_NOISE");
  }
  return Array.from(new Set(out));
}

// ============= 个人模型进化分 =============

export function computeEvolutionScore(
  state: SubjectWeightState,
  records: EnrichedFeedback[],
): number {
  const n = records.length;
  if (n === 0) return 0;

  const hits = records.filter((r) => r.hit).length;
  const hitRate = hits / n;

  // 最近 30 天有效回验
  const now = Date.now();
  const recent30 = records.filter((r) => {
    const t = new Date(r.date).getTime();
    return now - t <= 30 * 24 * 3600 * 1000;
  });
  const recent30Rate = n ? recent30.length / Math.max(n, 5) : 0;

  // 偏差可解释率
  const withBias = records.filter((r) => (r.biasTypes?.length ?? 0) > 0).length;
  const biasExplainRate = n ? withBias / n : 0;

  // 噪声回验比例
  const noiseRatio = records.filter((r) =>
    (r.biasTypes ?? []).includes("SIGNAL_NOISE") || (r.noiseInfluence ?? 0) >= 60,
  ).length / n;

  // 权重稳定度：最近 5 次调整幅度
  const recentAdj = state.history.slice(0, 5)
    .flatMap((h) => h.adjustments.map((a) => Math.abs(a.delta)));
  const stability = recentAdj.length
    ? clamp(1 - recentAdj.reduce((a, b) => a + b, 0) / recentAdj.length / 0.04, 0, 1)
    : 0.5;

  // 公式
  const base =
    Math.min(n / 40, 1) *        // 数量贡献
    (0.3 + hitRate * 0.7) *      // 命中率
    (0.4 + recent30Rate * 0.6) * // 近期活跃
    (0.4 + biasExplainRate * 0.6) *
    (0.4 + stability * 0.6);

  const penalty = clamp(1 - noiseRatio * 0.5, 0.4, 1);
  return Math.round(clamp(base * penalty * 100, 0, 100));
}

// ============= 定数历史可靠度 =============

export function determinationReliabilityRate(
  state: SubjectWeightState,
  status: DeterminationStatus,
): { rate: number; total: number; label: string } {
  const slot = state.determinationReliability[status];
  const rate = slot.total ? Math.round((slot.hits / slot.total) * 100) : 0;
  return { rate, total: slot.total, label: DETERMINATION_STATES[status].label };
}

// ============= 回验校正备注 =============

function composeCorrectionNote(r: EnrichedFeedback, biasTypes: FeedbackBiasType[]): string {
  if (biasTypes.length === 0) {
    return r.hit
      ? "事件命中，相关引擎与事件类型权重小幅增强。"
      : "未命中且偏差未归类，模型暂不调整核心引擎权重。";
  }
  const detail = biasTypes
    .map((b) => `${FEEDBACK_BIAS_TYPES[b].label}：${FEEDBACK_BIAS_TYPES[b].desc}`)
    .join(" | ");
  return `本次回验偏差归类为 ${biasTypes.length} 类（${biasTypes.map((b) => FEEDBACK_BIAS_TYPES[b].label).join("、")}）。${detail}`;
}

// ============= 权重比例 (用于矩阵显示) =============

export interface EngineWeightDisplay {
  key: string;
  label: string;
  en: string;
  defaultWeight: number;
  currentWeight: number;
  delta: number;     // 当前 - 默认
  recentDelta: number; // 最近一次变化
}

export function getEngineWeightDisplay(state: SubjectWeightState): EngineWeightDisplay[] {
  const recent = state.history[0];
  return ENGINE_WEIGHTS.map((e) => {
    const cur = state.engineWeights[e.key] ?? e.defaultWeight;
    const recentDelta = recent?.adjustments.find((a) => a.engine === e.key)?.delta ?? 0;
    return {
      key: e.key,
      label: e.label,
      en: e.en,
      defaultWeight: e.defaultWeight,
      currentWeight: cur,
      delta: +(cur - e.defaultWeight).toFixed(4),
      recentDelta,
    };
  });
}

// ============= Bias 分布 =============

export function biasDistribution(state: SubjectWeightState): Array<{ key: FeedbackBiasType; label: string; count: number; pct: number }> {
  const total = Object.values(state.biasCounts).reduce<number>((a, b) => a + (b ?? 0), 0);
  return Object.entries(state.biasCounts)
    .map(([k, c]) => ({
      key: k as FeedbackBiasType,
      label: FEEDBACK_BIAS_TYPES[k as FeedbackBiasType].label,
      count: c ?? 0,
      pct: total ? Math.round(((c ?? 0) / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export { evolutionBand };
