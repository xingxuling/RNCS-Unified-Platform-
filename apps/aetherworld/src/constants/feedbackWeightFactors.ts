// 各引擎默认权重与归一化函数
export interface EngineWeightMeta {
  key: string;
  label: string;
  en: string;
  defaultWeight: number; // 0-1
  group: "calculus" | "meta";
}

export const ENGINE_WEIGHTS: EngineWeightMeta[] = [
  { key: "signalPurification",  label: "信号净化", en: "Signal Purification", defaultWeight: 0.12, group: "calculus" },
  { key: "domainFolding",       label: "折域计算", en: "Domain Folding",      defaultWeight: 0.11, group: "calculus" },
  { key: "pressureRebound",     label: "反冲压力", en: "Pressure Rebound",    defaultWeight: 0.09, group: "calculus" },
  { key: "resonanceLock",       label: "共振锁定", en: "Resonance Lock",      defaultWeight: 0.09, group: "calculus" },
  { key: "branchCollapse",      label: "分支塌缩", en: "Branch Collapse",     defaultWeight: 0.12, group: "calculus" },
  { key: "constantValue",       label: "常数计算", en: "Constant Value",      defaultWeight: 0.08, group: "calculus" },
  { key: "productVitality",     label: "产品活性", en: "Product Vitality",    defaultWeight: 0.08, group: "calculus" },
  { key: "geoFactor",           label: "地理因素", en: "Geo-Factor",          defaultWeight: 0.08, group: "calculus" },
  { key: "promptCalculus",      label: "提示词法", en: "Prompt Calculus",     defaultWeight: 0.06, group: "calculus" },
  { key: "scatterTrigger",      label: "抽散触发", en: "Scatter Trigger",     defaultWeight: 0.09, group: "calculus" },
  { key: "determinantNumber",   label: "定数计算", en: "Determinant Number",  defaultWeight: 0.08, group: "calculus" },
  { key: "regionalUX",          label: "地区体验", en: "Regional UX",         defaultWeight: 0.05, group: "meta" },
];

export const DEFAULT_ENGINE_WEIGHTS: Record<string, number> = Object.fromEntries(
  ENGINE_WEIGHTS.map((e) => [e.key, e.defaultWeight]),
);

export const FEEDBACK_WEIGHT_FORMULA = {
  positive: ["hitAccuracy", "eventTypeMatch", "timingAccuracy", "actionValidity",
             "signalQualityAtPrediction", "determinationReliability", "regionalUXFit"],
  negative: ["noiseInfluence", "userActionDistortion", "missingVariablePenalty"],
};

/** 进化分等级 */
export const EVOLUTION_BANDS = [
  { min: 0,  max: 20,  label: "未形成模型", advice: "继续完成回验，积累基础数据。", tone: "low"  as const },
  { min: 21, max: 40,  label: "初始校准中", advice: "至少完成 10 条回验以提高定数判断可靠性。", tone: "low"  as const },
  { min: 41, max: 60,  label: "有效学习中", advice: "保持回验频率，关注偏差类型分布。", tone: "mid"  as const },
  { min: 61, max: 80,  label: "个体模型稳定", advice: "可以信赖定数判断，但仍需定期回验。", tone: "high" as const },
  { min: 81, max: 100, label: "高可信个体模型", advice: "模型已经具备个体校准能力。", tone: "peak" as const },
];

export function evolutionBand(score: number) {
  return EVOLUTION_BANDS.find((b) => score >= b.min && score <= b.max) ?? EVOLUTION_BANDS[0];
}
