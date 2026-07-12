// System Constitution v0.2 — Forbidden Claims
export interface ForbiddenClaim {
  claimId: string;
  pattern: string[];
  reason: string;
  severity: "HIGH" | "CRITICAL";
}

export const FORBIDDEN_CLAIMS: ForbiddenClaim[] = [
  { claimId: "FC_ABSOLUTE_PREDICTION", pattern: ["100% 准确", "绝对预测", "必然发生"], reason: "系统不绝对预测现实", severity: "CRITICAL" },
  { claimId: "FC_MEDICAL_DIAGNOSIS", pattern: ["诊断为", "确诊", "你患有"], reason: "不替代医疗", severity: "CRITICAL" },
  { claimId: "FC_LEGAL_ADVICE", pattern: ["法律建议", "你应起诉", "代表诉讼"], reason: "不替代法律", severity: "CRITICAL" },
  { claimId: "FC_FINANCIAL_ADVICE", pattern: ["投资建议", "保证收益", "稳赚"], reason: "不替代金融", severity: "CRITICAL" },
  { claimId: "FC_CURRENCY_REDEEM", pattern: ["可兑换现金", "可提现", "可投资"], reason: "数列货币非金融", severity: "CRITICAL" },
  { claimId: "FC_VIRTUAL_AS_REAL", pattern: ["这是现实事件", "真实历史是"], reason: "虚拟≠现实", severity: "CRITICAL" },
  { claimId: "FC_BLACKBOX_AS_FACT", pattern: ["系统确定", "黑箱确认"], reason: "黑箱≠事实", severity: "HIGH" },
  { claimId: "FC_REPLACE_ENGINE", pattern: ["替代 Unity", "替代 Godot", "替代 Unreal"], reason: "不替代专业引擎", severity: "HIGH" },
  { claimId: "FC_IDENTITY_ABSOLUTE", pattern: ["你的命运注定", "你必将"], reason: "不固定用户身份", severity: "HIGH" },
];
