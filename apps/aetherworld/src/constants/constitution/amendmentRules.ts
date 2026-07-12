// System Constitution v0.2 — Amendment Rules
export interface AmendmentRule {
  ruleId: string;
  description: string;
  requiresStrongConfirmation: boolean;
}

export const AMENDMENT_RULES: AmendmentRule[] = [
  { ruleId: "AR_FOUNDER_ONLY_PROPOSE", description: "仅 Founder 可提出宪法修订。", requiresStrongConfirmation: false },
  { ruleId: "AR_MUST_VERSION", description: "修订必须生成版本。", requiresStrongConfirmation: false },
  { ruleId: "AR_RECORD_CHANGES", description: "修订必须记录 changedArticles。", requiresStrongConfirmation: false },
  { ruleId: "AR_RUN_COMPLIANCE", description: "修订必须运行 Constitutional Compliance。", requiresStrongConfirmation: false },
  { ruleId: "AR_STRONG_CONFIRM_CRITICAL", description: "修订 Safety/Privacy/Currency/Founder Lock 条款需强确认。", requiresStrongConfirmation: true },
  { ruleId: "AR_OLD_VERSION_VIEWABLE", description: "旧版本可查看。", requiresStrongConfirmation: false },
  { ruleId: "AR_ROLLBACK_LOGGED", description: "回滚必须记录。", requiresStrongConfirmation: false },
  { ruleId: "AR_TRIGGER_RECALCULATION", description: "宪法变更必须触发 Recalculation。", requiresStrongConfirmation: false },
  { ruleId: "AR_NO_PUBLIC_USER_MUTATE", description: "普通用户不得修改 Founder Locked 条款。", requiresStrongConfirmation: false },
  { ruleId: "AR_NO_DISABLE_CORE_SAFETY", description: "不允许关闭核心安全原则。", requiresStrongConfirmation: false },
];
