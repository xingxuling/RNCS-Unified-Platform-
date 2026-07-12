// Constant Universe v0.2 — Safety Rules (常数级安全边界)
export interface ConstantSafetyRule {
  ruleId: string;
  description: string;
  enforcement: "BLOCK" | "WARN" | "AUDIT";
}

export const CONSTANT_SAFETY_RULES: ConstantSafetyRule[] = [
  { ruleId: "NO_REAL_PHYSICS_CLAIM", description: "不得把系统常数说成现实宇宙物理定律", enforcement: "BLOCK" },
  { ruleId: "NO_ABSOLUTE_PREDICTION", description: "不得把预测阈值说成绝对准确", enforcement: "BLOCK" },
  { ruleId: "NO_USER_SAFETY_MUTATION", description: "普通用户不得修改 Safety 常数", enforcement: "BLOCK" },
  { ruleId: "NO_DEMO_REAL_MIX", description: "禁止 Demo / Real 常数混用", enforcement: "BLOCK" },
  { ruleId: "CURRENCY_NON_FINANCIAL_LOCKED", description: "Currency 非金融边界常数不得关闭", enforcement: "BLOCK" },
  { ruleId: "FULL60_PRIVACY_LOCKED", description: "Full60 隐私常数不得关闭", enforcement: "BLOCK" },
  { ruleId: "FOUNDER_LOCKED_IMMUTABLE", description: "Founder Locked 常数对普通用户只读", enforcement: "BLOCK" },
  { ruleId: "AUDIT_ON_CHANGE", description: "任何常数变更必须写入审计日志", enforcement: "AUDIT" },
];

export const CURRENCY_NON_FINANCIAL_LOCKS = {
  INTERNAL_ONLY: true,
  CASH_REDEEMABLE: false,
  TRANSFERABLE: false,
  INVESTMENT_ASSET: false,
} as const;
