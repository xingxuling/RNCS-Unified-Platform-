export const CROSS_FUNCTIONAL_RISK_TYPES = [
  "MEANING_DRIFT",
  "DEMO_REAL_CONFUSION",
  "FOUNDER_LEAK",
  "CURRENCY_FINANCIALIZATION",
  "VIRTUAL_AS_REALITY",
  "REALITY_AS_VIRTUAL",
  "OVERGENERATION",
  "PRIVACY_LEAK",
  "SAFETY_BOUNDARY_LOST",
  "OVERPROMISE",
] as const;
export type CrossFunctionalRiskType = (typeof CROSS_FUNCTIONAL_RISK_TYPES)[number];

export const RISK_LABELS: Record<CrossFunctionalRiskType, string> = {
  MEANING_DRIFT: "意义漂移",
  DEMO_REAL_CONFUSION: "Demo / Real 混淆",
  FOUNDER_LEAK: "Founder-only 泄漏",
  CURRENCY_FINANCIALIZATION: "数列货币金融化",
  VIRTUAL_AS_REALITY: "虚拟世界被写成现实",
  REALITY_AS_VIRTUAL: "现实数据被写成虚构",
  OVERGENERATION: "过度生成",
  PRIVACY_LEAK: "隐私泄露",
  SAFETY_BOUNDARY_LOST: "安全边界丢失",
  OVERPROMISE: "输出过度承诺",
};
