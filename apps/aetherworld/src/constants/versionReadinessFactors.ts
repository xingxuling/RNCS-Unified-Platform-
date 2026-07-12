// Version Iteration Calculus — readiness factors (0-100 scale)
// Positive factors lift readiness; negative factors damp it.

export type VersionPositiveFactorKey =
  | "coreLoopCompleteness"
  | "userJourneyCompletion"
  | "calculationEngineStability"
  | "feedbackLearningReadiness"
  | "privacySafety"
  | "documentationCompleteness"
  | "betaLaunchReadiness"
  | "regionalUXFit"
  | "productCoherence";

export type VersionNegativeFactorKey =
  | "featureFragmentation"
  | "cognitiveOverload"
  | "misuseRisk"
  | "unverifiedClaims";

export interface VersionFactorMeta {
  key: VersionPositiveFactorKey | VersionNegativeFactorKey;
  cn: string;
  en: string;
  desc: string;
  polarity: "positive" | "negative";
  defaultValue: number;
}

export const VERSION_POSITIVE_FACTORS: Record<VersionPositiveFactorKey, VersionFactorMeta> = {
  coreLoopCompleteness: {
    key: "coreLoopCompleteness",
    cn: "核心闭环完整度",
    en: "Core Loop Completeness",
    desc: "主体 → 预测 → 定数 → 行动 → 回验是否能完整跑通。",
    polarity: "positive",
    defaultValue: 78,
  },
  userJourneyCompletion: {
    key: "userJourneyCompletion",
    cn: "用户路径完成度",
    en: "User Journey Completion",
    desc: "用户能否独立完成首次完整体验。",
    polarity: "positive",
    defaultValue: 64,
  },
  calculationEngineStability: {
    key: "calculationEngineStability",
    cn: "计算引擎稳定性",
    en: "Calculation Engine Stability",
    desc: "多计算法 + 定数 + 权重是否稳定可重复输出。",
    polarity: "positive",
    defaultValue: 74,
  },
  feedbackLearningReadiness: {
    key: "feedbackLearningReadiness",
    cn: "回验学习准备度",
    en: "Feedback Learning Readiness",
    desc: "回验是否可记录并反向修正权重。",
    polarity: "positive",
    defaultValue: 66,
  },
  privacySafety: {
    key: "privacySafety",
    cn: "隐私安全",
    en: "Privacy Safety",
    desc: "Full 60 是否仅本地保存、可删除、与 Demo 隔离。",
    polarity: "positive",
    defaultValue: 82,
  },
  documentationCompleteness: {
    key: "documentationCompleteness",
    cn: "文档完整度",
    en: "Documentation Completeness",
    desc: "白皮书、手册、计算法、回验、安全边界是否齐备。",
    polarity: "positive",
    defaultValue: 76,
  },
  betaLaunchReadiness: {
    key: "betaLaunchReadiness",
    cn: "内测准备度",
    en: "Beta Launch Readiness",
    desc: "Beta Launch Calculus 是否给出 ≥ Private Alpha 状态。",
    polarity: "positive",
    defaultValue: 65,
  },
  regionalUXFit: {
    key: "regionalUXFit",
    cn: "地区体验适配",
    en: "Regional UX Fit",
    desc: "地区用户体验计算是否能为目标用户群提供适配。",
    polarity: "positive",
    defaultValue: 62,
  },
  productCoherence: {
    key: "productCoherence",
    cn: "产品一致性",
    en: "Product Coherence",
    desc: "页面、术语、UI 风格、文档是否协调一致。",
    polarity: "positive",
    defaultValue: 72,
  },
};

export const VERSION_NEGATIVE_FACTORS: Record<VersionNegativeFactorKey, VersionFactorMeta> = {
  featureFragmentation: {
    key: "featureFragmentation",
    cn: "功能碎片化",
    en: "Feature Fragmentation",
    desc: "功能是否过多、入口是否凌乱。",
    polarity: "negative",
    defaultValue: 48,
  },
  cognitiveOverload: {
    key: "cognitiveOverload",
    cn: "认知过载",
    en: "Cognitive Overload",
    desc: "术语、概念、计算法是否压垮新用户。",
    polarity: "negative",
    defaultValue: 58,
  },
  misuseRisk: {
    key: "misuseRisk",
    cn: "误用风险",
    en: "Misuse Risk",
    desc: "用户是否可能误读为绝对预测。",
    polarity: "negative",
    defaultValue: 52,
  },
  unverifiedClaims: {
    key: "unverifiedClaims",
    cn: "未验证声明",
    en: "Unverified Claims",
    desc: "文案中是否存在尚未由回验支持的强断。",
    polarity: "negative",
    defaultValue: 40,
  },
};

export const VERSION_ALL_FACTORS: VersionFactorMeta[] = [
  ...Object.values(VERSION_POSITIVE_FACTORS),
  ...Object.values(VERSION_NEGATIVE_FACTORS),
];

export type VersionFactorScores = Record<
  VersionPositiveFactorKey | VersionNegativeFactorKey,
  number
>;

export const DEFAULT_VERSION_FACTOR_SCORES: VersionFactorScores = Object.fromEntries(
  VERSION_ALL_FACTORS.map((f) => [f.key, f.defaultValue]),
) as VersionFactorScores;
