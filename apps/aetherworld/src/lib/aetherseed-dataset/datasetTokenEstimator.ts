// AetherSeed Dataset · Token 估算与模型适配度 v0.1
// 仅做本地估算，不调用任何外部 tokenizer，不上传数据。
// 估算规则（粗略但稳定）：
//   - 中文 / CJK 字符：每个字 ≈ 1 token
//   - 其他可见字符：每 4 个字符 ≈ 1 token
//   - 空白与控制字符忽略
import type { EvalSample, TrainingSample } from "./datasetTypes";
import { listTrainingSamples } from "./trainingSampleStore";
import { listEvalSamples } from "./evalSampleStore";

export type SampleFormatBucket =
  | "SFT_JSONL"
  | "ALPACA"
  | "PRETRAIN_TEXT"
  | "CHATML"
  | "MSL"
  | "LOVABLE_PROMPT"
  | "OTHER";

export const SAMPLE_FORMAT_LABEL: Record<SampleFormatBucket, string> = {
  SFT_JSONL: "SFT JSONL",
  ALPACA: "Alpaca",
  PRETRAIN_TEXT: "预训练 Text",
  CHATML: "ChatML",
  MSL: "MSL",
  LOVABLE_PROMPT: "Lovable Prompt",
  OTHER: "其他",
};

const CJK = /[\u3400-\u9fff\uf900-\ufaff\u3000-\u303f]/;

/** 估算单段文本 token 数（粗略）。 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  let cjk = 0;
  let other = 0;
  for (const ch of text) {
    if (/\s/.test(ch)) continue;
    if (CJK.test(ch)) cjk += 1;
    else other += 1;
  }
  return cjk + Math.ceil(other / 4);
}

function sampleText(s: TrainingSample): string {
  const out = typeof s.output === "string" ? s.output : JSON.stringify(s.output);
  return [s.instruction ?? "", s.input ?? "", out].join("\n");
}

function evalText(e: EvalSample): string {
  const ex = typeof e.expected === "string" ? e.expected : JSON.stringify(e.expected);
  return [e.question ?? "", ex, (e.criteria ?? []).join("\n")].join("\n");
}

/** 把 intake/dataset sampleType 字符串归一为 6 类格式桶。
 *  修正：原先未识别 IntakeCompiledOutputType（SFT_JSONL/ROUTER_JSON/MSL_JSON 等），导致 SFT token 显示 0。 */
export function classifySampleFormat(sampleType: string): SampleFormatBucket {
  const t = (sampleType || "").toUpperCase();
  // 1. IntakeCompiledOutputType 显式字符串优先匹配
  if (t === "SFT_JSONL" || t.startsWith("SFT")) return "SFT_JSONL";
  if (t === "ALPACA" || t.includes("ALPACA")) return "ALPACA";
  if (t === "CHATML" || t.includes("CHATML")) return "CHATML";
  if (t === "PRETRAIN_TEXT" || t.startsWith("PRETRAIN")) return "PRETRAIN_TEXT";
  if (t === "MSL_JSON" || t.startsWith("MSL") || t.includes("STATE_") || t.includes("STATUS_")) return "MSL";
  if (t === "LOVABLE_PROMPT_JSON" || t.includes("LOVABLE")) return "LOVABLE_PROMPT";
  // 2. 业务类样本归类
  if (t.includes("NARRATIVE") || t.includes("WORLD_GENERATION") || t.includes("CHARACTER") || t.includes("VOCAL_PROMPT")) {
    return "PRETRAIN_TEXT";
  }
  // 3. 默认指令样本归入 SFT_JSONL
  if (
    t.includes("SAMPLE") || t.includes("REASONING") || t.includes("INSTRUCTION") ||
    t.includes("QA") || t.includes("ROUTING") || t.includes("DESIGN") ||
    t.includes("CODE") || t.includes("HANDOFF") || t.includes("PANEL") ||
    t.includes("CALCULUS") || t.includes("VERIFICATION") || t.includes("AUDIT") ||
    t.includes("CHANGELOG") || t.includes("ACCEPTANCE") || t.includes("PREDICTION") ||
    t.includes("EVOLUTION") || t.includes("COMPILATION") || t.includes("FUSION") ||
    t.includes("MAPPING") || t.includes("ASSIST") || t.includes("ROUTER") || t.includes("TOOL")
  ) {
    return "SFT_JSONL";
  }
  return "OTHER";
}

export interface TokenStatsRow {
  bucket: SampleFormatBucket;
  bucketLabel: string;
  sampleCount: number;
  totalTokens: number;
  avgTokens: number;
}

export type LengthTier = "SHORT" | "MEDIUM" | "LONG" | "XLONG";

export const LENGTH_TIER_LABEL: Record<LengthTier, string> = {
  SHORT: "短样本 (0–150 token)",
  MEDIUM: "中样本 (150–800 token)",
  LONG: "长样本 (800–3000 token)",
  XLONG: "超长样本 (3000+ token)",
};

export const LENGTH_TIER_USAGE: Record<LengthTier, string> = {
  SHORT: "路由 / 分类 / 短问答 / 冒烟测试",
  MEDIUM: "SFT / 结构问答 / 提示词生成",
  LONG: "预训练 / 方法论吸收 / 系统文档学习",
  XLONG: "长文档预训练（需确认 contextLength）",
};

export interface LengthTierRow {
  tier: LengthTier;
  tierLabel: string;
  usage: string;
  sampleCount: number;
  totalTokens: number;
  tokenShare: number; // 0~1
}

export type SplitPreset = "BALANCED_90_10" | "EVAL_HEAVY_85_15" | "TRAIN_HEAVY_95_5";

export const SPLIT_PRESET_LABEL: Record<SplitPreset, string> = {
  BALANCED_90_10: "训练 90% / 评测 10%（默认）",
  EVAL_HEAVY_85_15: "训练 85% / 评测 15%",
  TRAIN_HEAVY_95_5: "训练 95% / 评测 5%",
};

export const SPLIT_PRESET_EVAL_RATIO: Record<SplitPreset, number> = {
  BALANCED_90_10: 0.1,
  EVAL_HEAVY_85_15: 0.15,
  TRAIN_HEAVY_95_5: 0.05,
};

export interface SplitAnalysis {
  preset: SplitPreset;
  presetLabel: string;
  targetEvalRatio: number;
  currentTrainTokens: number;
  currentEvalTokens: number;
  currentEvalRatio: number;
  /** evalRatio > trainRatio 视为不健康 */
  unhealthy: boolean;
  /** 建议从评测集移除多少 token 才能达到目标比例（负数表示需要补充评测） */
  evalTokensToTrim: number;
  /** 同上但用样本条数近似（按平均评测 token 折算） */
  evalSamplesToTrim: number;
  hint: string;
}

export interface QualityPanel {
  effectiveTokens: number;
  trainEvalRatioText: string;
  avgSampleTokens: number;
  midLongShare: number; // 中+长占比
  sftTokens: number;
  alpacaTokens: number;
  pretrainTokens: number;
  chatmlTokens: number;
  okForSmoke: boolean;
  okForFirstRelease: boolean;
  comments: string[];
}

export interface SmokeReadiness {
  ready: boolean;
  suggestedName: string;
  reasons: string[];
  forbiddenLabels: string[];
}

export interface DatasetTokenStats {
  generatedAt: string;
  trainingSampleCount: number;
  evalSampleCount: number;
  trainingTotalTokens: number;
  evalTotalTokens: number;
  avgTrainingTokens: number;
  maxTrainingTokens: number;
  minTrainingTokens: number;
  /** 基于 instruction+output 拼接的近似去重率 0~1（重复条目占比） */
  duplicationRate: number;
  /** 有效 token 估算 = 总 token × (1 - 重复率) × (1 - WARN 折扣) */
  effectiveTrainingTokens: number;
  byFormat: TokenStatsRow[];
  byLengthTier: LengthTierRow[];
  /** 当前训练 vs 评测划分分析（默认按 90/10） */
  splitAnalysis: SplitAnalysis;
  qualityPanel: QualityPanel;
  smokeReadiness: SmokeReadiness;
  /** 文案警告：样本条数 ≠ token 数 */
  caveats: string[];
}

export const TOKEN_STATS_CAVEATS: string[] = [
  "样本条数不等于 token 数。当前数据量足够冒烟测试，不代表足够训练出高质量模型。",
  "本估算基于本地启发式（中文 1 字 ≈ 1 token，其他字符 4 字符 ≈ 1 token），与真实 tokenizer 会有 ±20% 偏差。",
  "重复率仅按 instruction+output 文本指纹估算，不代表语义去重。",
  "有效 token 数 = 总 token × (1 − 重复率) × (1 − WARN 折扣 0.5)。",
];

function tierOf(tk: number): LengthTier {
  if (tk < 150) return "SHORT";
  if (tk < 800) return "MEDIUM";
  if (tk < 3000) return "LONG";
  return "XLONG";
}

function buildSplitAnalysis(
  trainTokens: number,
  evalTokens: number,
  evalSampleCount: number,
  preset: SplitPreset = "BALANCED_90_10",
): SplitAnalysis {
  const total = trainTokens + evalTokens;
  const currentEvalRatio = total === 0 ? 0 : evalTokens / total;
  const targetEvalRatio = SPLIT_PRESET_EVAL_RATIO[preset];
  const desiredEvalTokens = Math.round(total * targetEvalRatio);
  const evalTokensToTrim = Math.max(0, evalTokens - desiredEvalTokens);
  const avgEval = evalSampleCount === 0 ? 0 : evalTokens / evalSampleCount;
  const evalSamplesToTrim = avgEval === 0 ? 0 : Math.round(evalTokensToTrim / avgEval);
  const unhealthy = evalTokens > trainTokens;
  let hint = "";
  if (unhealthy) {
    hint = `当前评测 token (${formatTokens(evalTokens)}) 大于训练 token (${formatTokens(trainTokens)})，不适合第一炉。第一炉建议评测占 5%–15%。`;
  } else if (currentEvalRatio > targetEvalRatio + 0.05) {
    hint = `评测占比 ${(currentEvalRatio * 100).toFixed(1)}% 偏高，建议下调至 ${(targetEvalRatio * 100).toFixed(0)}%。`;
  } else if (currentEvalRatio < Math.max(0.02, targetEvalRatio - 0.05)) {
    hint = `评测占比 ${(currentEvalRatio * 100).toFixed(1)}% 偏低，建议补充评测样本。`;
  } else {
    hint = `评测占比 ${(currentEvalRatio * 100).toFixed(1)}% 处于健康区间。`;
  }
  return {
    preset,
    presetLabel: SPLIT_PRESET_LABEL[preset],
    targetEvalRatio,
    currentTrainTokens: trainTokens,
    currentEvalTokens: evalTokens,
    currentEvalRatio,
    unhealthy,
    evalTokensToTrim,
    evalSamplesToTrim,
    hint,
  };
}

function buildQualityPanel(
  byFormat: TokenStatsRow[],
  byTier: LengthTierRow[],
  effectiveTokens: number,
  split: SplitAnalysis,
  avgTokens: number,
): QualityPanel {
  const get = (b: SampleFormatBucket) => byFormat.find((r) => r.bucket === b)?.totalTokens ?? 0;
  const midLongShare = byTier
    .filter((r) => r.tier === "MEDIUM" || r.tier === "LONG" || r.tier === "XLONG")
    .reduce((acc, r) => acc + r.tokenShare, 0);
  const okForSmoke = effectiveTokens >= 50_000;
  const okForFirstRelease = effectiveTokens >= 300_000_000 && !split.unhealthy && midLongShare >= 0.4;
  const comments: string[] = [];
  if (avgTokens < 80) comments.push(`平均每条样本仅 ${avgTokens} token，明显偏短：建议改用「中切片」或「混合」切片模式。`);
  if (midLongShare < 0.3) comments.push(`中长样本仅占 ${(midLongShare * 100).toFixed(1)}%，难以训练出方法论与系统级理解。`);
  if (split.unhealthy) comments.push("评测集 token 大于训练集，不适合作为正式训练集。");
  if (okForSmoke && !okForFirstRelease) comments.push("当前数据足够验证训练链路，不代表足够训练出高质量模型。");
  return {
    effectiveTokens,
    trainEvalRatioText: `${formatTokens(split.currentTrainTokens)} / ${formatTokens(split.currentEvalTokens)} (评测占 ${(split.currentEvalRatio * 100).toFixed(1)}%)`,
    avgSampleTokens: avgTokens,
    midLongShare,
    sftTokens: get("SFT_JSONL"),
    alpacaTokens: get("ALPACA"),
    pretrainTokens: get("PRETRAIN_TEXT"),
    chatmlTokens: get("CHATML"),
    okForSmoke,
    okForFirstRelease,
    comments,
  };
}

function buildSmokeReadiness(quality: QualityPanel): SmokeReadiness {
  const ready = quality.okForSmoke;
  const reasons: string[] = [];
  if (ready) {
    reasons.push(`有效 token ${formatTokens(quality.effectiveTokens)} ≥ 冒烟门槛 50K`);
    reasons.push("可用于：数据链路验证 / 本机训练脚本验证 / dry-run / 本地执行网关 / 实验账本");
  } else {
    reasons.push(`有效 token ${formatTokens(quality.effectiveTokens)} 未达冒烟门槛 50K`);
  }
  return {
    ready,
    suggestedName: "AetherSeed-300M-Smoke-Dataset-v0.1",
    reasons,
    forbiddenLabels: [
      "不得标记为「正式高质量训练集」",
      "不得标记为「AetherSeed 300M 第一版完成」",
      "不得用于发布、对外展示或商用",
    ],
  };
}

export function computeDatasetTokenStats(
  splitPreset: SplitPreset = "BALANCED_90_10",
): DatasetTokenStats {
  const trainings = listTrainingSamples();
  const evals = listEvalSamples();

  const trainingTokensList: number[] = [];
  const bucketAgg = new Map<SampleFormatBucket, { count: number; tokens: number }>();
  const tierAgg = new Map<LengthTier, { count: number; tokens: number }>();
  const fingerprintCount = new Map<string, number>();
  let warnedTokens = 0;

  for (const s of trainings) {
    const text = sampleText(s);
    const tk = estimateTokens(text);
    trainingTokensList.push(tk);

    const bucket = classifySampleFormat(s.sampleType);
    const row = bucketAgg.get(bucket) ?? { count: 0, tokens: 0 };
    row.count += 1;
    row.tokens += tk;
    bucketAgg.set(bucket, row);

    const tier = tierOf(tk);
    const trow = tierAgg.get(tier) ?? { count: 0, tokens: 0 };
    trow.count += 1;
    trow.tokens += tk;
    tierAgg.set(tier, trow);

    const fp = `${(s.instruction || "").trim().slice(0, 64)}::${
      typeof s.output === "string" ? s.output.trim().slice(0, 64) : JSON.stringify(s.output).slice(0, 64)
    }`;
    fingerprintCount.set(fp, (fingerprintCount.get(fp) ?? 0) + 1);

    if (s.safetyStatus === "WARN") warnedTokens += tk;
  }

  const evalTotalTokens = evals.reduce((acc, e) => acc + estimateTokens(evalText(e)), 0);
  const trainingTotalTokens = trainingTokensList.reduce((a, b) => a + b, 0);
  const trainingSampleCount = trainings.length;

  const duplicates = Array.from(fingerprintCount.values()).reduce(
    (acc, c) => acc + Math.max(0, c - 1),
    0,
  );
  const duplicationRate = trainingSampleCount === 0 ? 0 : duplicates / trainingSampleCount;
  const warnRatio = trainingTotalTokens === 0 ? 0 : warnedTokens / trainingTotalTokens;

  const effectiveTrainingTokens = Math.round(
    trainingTotalTokens * (1 - Math.min(0.95, duplicationRate)) * (1 - 0.5 * warnRatio),
  );

  const byFormat: TokenStatsRow[] = (
    ["SFT_JSONL", "ALPACA", "PRETRAIN_TEXT", "CHATML", "MSL", "LOVABLE_PROMPT"] as SampleFormatBucket[]
  ).map((b) => {
    const row = bucketAgg.get(b) ?? { count: 0, tokens: 0 };
    return {
      bucket: b,
      bucketLabel: SAMPLE_FORMAT_LABEL[b],
      sampleCount: row.count,
      totalTokens: row.tokens,
      avgTokens: row.count === 0 ? 0 : Math.round(row.tokens / row.count),
    };
  });

  const byLengthTier: LengthTierRow[] = (["SHORT", "MEDIUM", "LONG", "XLONG"] as LengthTier[]).map((t) => {
    const row = tierAgg.get(t) ?? { count: 0, tokens: 0 };
    return {
      tier: t,
      tierLabel: LENGTH_TIER_LABEL[t],
      usage: LENGTH_TIER_USAGE[t],
      sampleCount: row.count,
      totalTokens: row.tokens,
      tokenShare: trainingTotalTokens === 0 ? 0 : row.tokens / trainingTotalTokens,
    };
  });

  const avgTrainingTokens = trainingSampleCount === 0 ? 0 : Math.round(trainingTotalTokens / trainingSampleCount);
  const splitAnalysis = buildSplitAnalysis(trainingTotalTokens, evalTotalTokens, evals.length, splitPreset);
  const qualityPanel = buildQualityPanel(byFormat, byLengthTier, effectiveTrainingTokens, splitAnalysis, avgTrainingTokens);
  const smokeReadiness = buildSmokeReadiness(qualityPanel);

  return {
    generatedAt: new Date().toISOString(),
    trainingSampleCount,
    evalSampleCount: evals.length,
    trainingTotalTokens,
    evalTotalTokens,
    avgTrainingTokens,
    maxTrainingTokens: trainingTokensList.reduce((a, b) => (b > a ? b : a), 0),
    minTrainingTokens: trainingTokensList.length === 0 ? 0 : trainingTokensList.reduce((a, b) => (b < a ? b : a), trainingTokensList[0]),
    duplicationRate: Math.round(duplicationRate * 1000) / 1000,
    effectiveTrainingTokens,
    byFormat,
    byLengthTier,
    splitAnalysis,
    qualityPanel,
    smokeReadiness,
    caveats: TOKEN_STATS_CAVEATS,
  };
}

// ===== 模型适配度判断 =====

export type ModelTarget = "AETHERSEED_300M" | "AETHERSEED_1B";

export const MODEL_TARGET_LABEL: Record<ModelTarget, string> = {
  AETHERSEED_300M: "AetherSeed 300M 私有模型",
  AETHERSEED_1B: "AetherSeed 1B（未来）",
};

export type FitnessLevel = "SMOKE" | "INITIAL" | "FIRST_RELEASE";

export const FITNESS_LEVEL_LABEL: Record<FitnessLevel, string> = {
  SMOKE: "冒烟测试",
  INITIAL: "初步可用",
  FIRST_RELEASE: "正式第一版",
};

/** 各档位的有效 token 门槛（私有模型经验值，保守口径）。 */
export const FITNESS_THRESHOLDS: Record<ModelTarget, Record<FitnessLevel, number>> = {
  AETHERSEED_300M: {
    SMOKE: 50_000,
    INITIAL: 5_000_000,
    FIRST_RELEASE: 300_000_000,
  },
  AETHERSEED_1B: {
    SMOKE: 200_000,
    INITIAL: 50_000_000,
    FIRST_RELEASE: 1_000_000_000,
  },
};

export interface FitnessRow {
  level: FitnessLevel;
  levelLabel: string;
  thresholdTokens: number;
  ok: boolean;
  shortfallTokens: number;
}

export interface ModelFitnessReport {
  model: ModelTarget;
  modelLabel: string;
  effectiveTrainingTokens: number;
  rows: FitnessRow[];
  /** 当前可达到的最高档位 */
  reachedLevel: FitnessLevel | "NONE";
  reachedLevelLabel: string;
}

export function evaluateModelFitness(
  model: ModelTarget,
  effectiveTrainingTokens: number,
): ModelFitnessReport {
  const th = FITNESS_THRESHOLDS[model];
  const order: FitnessLevel[] = ["SMOKE", "INITIAL", "FIRST_RELEASE"];
  const rows: FitnessRow[] = order.map((lv) => {
    const t = th[lv];
    const ok = effectiveTrainingTokens >= t;
    return {
      level: lv,
      levelLabel: FITNESS_LEVEL_LABEL[lv],
      thresholdTokens: t,
      ok,
      shortfallTokens: ok ? 0 : t - effectiveTrainingTokens,
    };
  });
  let reached: FitnessLevel | "NONE" = "NONE";
  for (const r of rows) if (r.ok) reached = r.level;
  return {
    model,
    modelLabel: MODEL_TARGET_LABEL[model],
    effectiveTrainingTokens,
    rows,
    reachedLevel: reached,
    reachedLevelLabel: reached === "NONE" ? "未达冒烟门槛" : FITNESS_LEVEL_LABEL[reached],
  };
}

export function evaluateAllModelFitness(stats: DatasetTokenStats): ModelFitnessReport[] {
  return (Object.keys(FITNESS_THRESHOLDS) as ModelTarget[]).map((m) =>
    evaluateModelFitness(m, stats.effectiveTrainingTokens),
  );
}

/** 友好显示 token 数（自动 K/M/B）。 */
export function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
