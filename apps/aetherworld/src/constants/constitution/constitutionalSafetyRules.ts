// System Constitution v0.2 — Safety Rules
export interface ConstitutionalSafetyRule {
  ruleId: string;
  description: string;
  enforcement: "BLOCK" | "WARN" | "AUDIT";
}

export const CONSTITUTIONAL_SAFETY_RULES: ConstitutionalSafetyRule[] = [
  { ruleId: "CS_NOT_LEGAL_DOCUMENT", description: "系统宪法不是法律文件，不替代现实法律/合规/医疗/金融/心理/工程安全判断", enforcement: "WARN" },
  { ruleId: "CS_FOUNDER_LOCKED_IMMUTABLE_FOR_USERS", description: "Founder Locked 条款普通用户只读", enforcement: "BLOCK" },
  { ruleId: "CS_CRITICAL_VIOLATION_MUST_BLOCK", description: "CRITICAL 违规必须 block 输出", enforcement: "BLOCK" },
  { ruleId: "CS_SAFETY_PRIVACY_CURRENCY_LOCKED", description: "Safety/Privacy/Currency 边界条款不得关闭", enforcement: "BLOCK" },
  { ruleId: "CS_AMENDMENT_TRIGGERS_RECALC", description: "宪法变更必须触发 Recalculation 标记 stale", enforcement: "AUDIT" },
  { ruleId: "CS_OUTPUT_MUST_HAVE_STATUS", description: "受治理引擎输出必须包含 constitutionalStatus", enforcement: "AUDIT" },
];
