// Beta Launch Calculus — factor definitions and default scores (0-100).
// These defaults reflect the current state of the Aether Fate Engine.

export type BetaPositiveFactorKey =
  | "productMaturity"
  | "feedbackLoopStrength"
  | "userComprehension"
  | "privacySafety"
  | "determinationReliability"
  | "regionalUXFit"
  | "documentationCompleteness"
  | "operationalCapacity"
  | "realSubjectSafety";

export type BetaNegativeFactorKey =
  | "explanationCost"
  | "misuseRisk"
  | "overLaunchRisk"
  | "cognitiveOverload";

export interface BetaFactorMeta {
  key: BetaPositiveFactorKey | BetaNegativeFactorKey;
  cn: string;
  en: string;
  desc: string;
  polarity: "positive" | "negative";
  defaultValue: number; // 0-100
}

export const BETA_POSITIVE_FACTORS: Record<BetaPositiveFactorKey, BetaFactorMeta> = {
  productMaturity: {
    key: "productMaturity",
    cn: "产品成熟度",
    en: "Product Maturity",
    desc: "页面、数据结构、核心计算、文档是否稳定。",
    polarity: "positive",
    defaultValue: 72,
  },
  feedbackLoopStrength: {
    key: "feedbackLoopStrength",
    cn: "回验闭环强度",
    en: "Feedback Loop Strength",
    desc: "能否记录回验并将其映射回权重修正。",
    polarity: "positive",
    defaultValue: 68,
  },
  userComprehension: {
    key: "userComprehension",
    cn: "用户理解度",
    en: "User Comprehension",
    desc: "用户能否理解这不是普通算命，而是结构化预测 OS。",
    polarity: "positive",
    defaultValue: 55,
  },
  privacySafety: {
    key: "privacySafety",
    cn: "隐私安全",
    en: "Privacy Safety",
    desc: "真实主体数据是否本地保存、可删除、Demo 隔离。",
    polarity: "positive",
    defaultValue: 80,
  },
  determinationReliability: {
    key: "determinationReliability",
    cn: "定数可靠度",
    en: "Determination Reliability",
    desc: "定数计算法是否能输出未定/半定/已定/反定/假定。",
    polarity: "positive",
    defaultValue: 70,
  },
  regionalUXFit: {
    key: "regionalUXFit",
    cn: "地区体验适配",
    en: "Regional UX Fit",
    desc: "是否根据地区调整文案、入口、信任路径。",
    polarity: "positive",
    defaultValue: 65,
  },
  documentationCompleteness: {
    key: "documentationCompleteness",
    cn: "文档完整度",
    en: "Documentation Completeness",
    desc: "是否具备白皮书、手册、计算法说明、安全边界。",
    polarity: "positive",
    defaultValue: 75,
  },
  operationalCapacity: {
    key: "operationalCapacity",
    cn: "运营承载力",
    en: "Operational Capacity",
    desc: "当前能否处理回访、bug、误解、咨询。",
    polarity: "positive",
    defaultValue: 45,
  },
  realSubjectSafety: {
    key: "realSubjectSafety",
    cn: "真实主体安全",
    en: "Real Subject Safety",
    desc: "Full 60 是否不会污染 Demo，不会被公开展示。",
    polarity: "positive",
    defaultValue: 78,
  },
};

export const BETA_NEGATIVE_FACTORS: Record<BetaNegativeFactorKey, BetaFactorMeta> = {
  explanationCost: {
    key: "explanationCost",
    cn: "解释成本",
    en: "Explanation Cost",
    desc: "用户理解系统所需的时间与心智成本。",
    polarity: "negative",
    defaultValue: 60,
  },
  misuseRisk: {
    key: "misuseRisk",
    cn: "误用风险",
    en: "Misuse Risk",
    desc: "用户是否可能把预测当成绝对命令。",
    polarity: "negative",
    defaultValue: 55,
  },
  overLaunchRisk: {
    key: "overLaunchRisk",
    cn: "过早公开风险",
    en: "Over-Launch Risk",
    desc: "过早公开是否会损害产品定位与可信度。",
    polarity: "negative",
    defaultValue: 58,
  },
  cognitiveOverload: {
    key: "cognitiveOverload",
    cn: "认知过载",
    en: "Cognitive Overload",
    desc: "功能与术语是否过多导致用户无法进入体验。",
    polarity: "negative",
    defaultValue: 62,
  },
};

export const BETA_ALL_FACTORS: BetaFactorMeta[] = [
  ...Object.values(BETA_POSITIVE_FACTORS),
  ...Object.values(BETA_NEGATIVE_FACTORS),
];

export type BetaFactorScores = Record<
  BetaPositiveFactorKey | BetaNegativeFactorKey,
  number
>;

export const DEFAULT_BETA_FACTOR_SCORES: BetaFactorScores = Object.fromEntries(
  BETA_ALL_FACTORS.map((f) => [f.key, f.defaultValue]),
) as BetaFactorScores;
