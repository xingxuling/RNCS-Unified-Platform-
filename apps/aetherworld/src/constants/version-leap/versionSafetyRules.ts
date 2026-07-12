export interface VersionSafetyRule {
  id: string;
  label: string;
  rule: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const VERSION_SAFETY_RULES: VersionSafetyRule[] = [
  { id: "NO_COMMERCIAL_PROMISE", label: "禁止商业承诺",   rule: "版本跃迁评分不可表述为商业成功、用户增长或现实结果保证。", severity: "HIGH" },
  { id: "NO_WORLD_AS_REALITY",   label: "虚拟世界 ≠ 现实", rule: "版本说明不得把虚拟世界写成现实预测。",                       severity: "HIGH" },
  { id: "NO_CURRENCY_FIN",       label: "数列货币非金融",  rule: "版本说明不得把数列货币写成现实货币。",                       severity: "CRITICAL" },
  { id: "FOUNDER_LOCK",          label: "Founder 锁定",   rule: "Founder-only 版本与发布说明不得暴露给普通用户。",            severity: "CRITICAL" },
  { id: "SAFETY_NEED_APPROVAL",  label: "安全规则审批",    rule: "Safety / Privacy / Currency 常数变更必须经过 Founder 审批。", severity: "CRITICAL" },
  { id: "FULL60_PRIVACY",        label: "Full60 隐私",    rule: "Full60 相关版本必须包含隐私提示。",                          severity: "HIGH" },
];
