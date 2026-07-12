// 术语风险等级 · Jargon Risk Levels
export type JargonRisk = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export interface JargonRiskMeta {
  key: JargonRisk;
  cn: string;
  scoreRange: [number, number];
  defaultAction: string;
}

export const JARGON_RISK_META: Record<JargonRisk, JargonRiskMeta> = {
  LOW:     { key: "LOW",     cn: "易懂",     scoreRange: [0, 25],  defaultAction: "保留原文" },
  MEDIUM:  { key: "MEDIUM",  cn: "可接受",   scoreRange: [26, 50], defaultAction: "首次出现需 tooltip" },
  HIGH:    { key: "HIGH",    cn: "偏难",     scoreRange: [51, 70], defaultAction: "普通用户路径需替换" },
  EXTREME: { key: "EXTREME", cn: "极高门槛", scoreRange: [71, 100],defaultAction: "默认隐藏，仅高阶页面" },
};

// 密度阈值
export const JARGON_DENSITY_THRESHOLDS = {
  EASY:        25,
  ACCEPTABLE:  50,
  HARD:        70,
  HIGH:        85,
  EXTREME:     100,
};

// 不同页面类型的密度上限
export const PAGE_TYPE_JARGON_LIMIT: Record<string, number> = {
  user_main:    50,
  mobile:       40,
  enterprise:   30,
  demo:         35,
  docs:         100,
  advanced:     85,
};
