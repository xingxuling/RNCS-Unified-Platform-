// System Constitution v0.2 — Violation Types
export type ViolationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ViolationType {
  violationType: string;
  chineseName: string;
  defaultSeverity: ViolationSeverity;
  blockRequired: boolean;
  relatedArticles: string[];
}

export const VIOLATION_TYPES: ViolationType[] = [
  { violationType: "DEMO_REAL_MIXING", chineseName: "Demo/Real 混淆", defaultSeverity: "CRITICAL", blockRequired: true, relatedArticles: ["A010", "A025"] },
  { violationType: "FULL60_PRIVACY_LEAK", chineseName: "Full60 隐私泄露", defaultSeverity: "CRITICAL", blockRequired: true, relatedArticles: ["A010", "A090"] },
  { violationType: "FOUNDER_LOCK_BYPASS", chineseName: "Founder Lock 绕过", defaultSeverity: "CRITICAL", blockRequired: true, relatedArticles: ["A020", "A130"] },
  { violationType: "CONSTANT_CONFLICT", chineseName: "常数冲突", defaultSeverity: "HIGH", blockRequired: false, relatedArticles: ["A030"] },
  { violationType: "SAFETY_BYPASS", chineseName: "安全绕过", defaultSeverity: "CRITICAL", blockRequired: true, relatedArticles: ["A100"] },
  { violationType: "FICTION_AS_REALITY", chineseName: "虚构当现实", defaultSeverity: "CRITICAL", blockRequired: true, relatedArticles: ["A050", "A060"] },
  { violationType: "CURRENCY_FINANCIALIZATION", chineseName: "数列货币金融化", defaultSeverity: "CRITICAL", blockRequired: true, relatedArticles: ["A070"] },
  { violationType: "BLACKBOX_FACT_CLAIM", chineseName: "黑箱当事实", defaultSeverity: "HIGH", blockRequired: false, relatedArticles: ["A080"] },
  { violationType: "NO_VALIDATION_PATH", chineseName: "缺少回验路径", defaultSeverity: "MEDIUM", blockRequired: false, relatedArticles: ["A110"] },
  { violationType: "NO_METADATA", chineseName: "缺少 metadata", defaultSeverity: "MEDIUM", blockRequired: false, relatedArticles: ["A040"] },
  { violationType: "OVERCLAIM", chineseName: "过度承诺", defaultSeverity: "HIGH", blockRequired: false, relatedArticles: ["A080", "A100"] },
  { violationType: "ENGINE_AUTHORITY_OVERREACH", chineseName: "引擎权限越界", defaultSeverity: "HIGH", blockRequired: false, relatedArticles: ["A040"] },
];

export function getViolationType(type: string): ViolationType | undefined {
  return VIOLATION_TYPES.find((v) => v.violationType === type);
}
