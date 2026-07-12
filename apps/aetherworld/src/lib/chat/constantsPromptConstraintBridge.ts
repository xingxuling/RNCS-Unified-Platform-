// 常数宇宙 → Chat Prompt 硬约束词典。
// 按领域注入允许的枚举词表，让模型输出不会随意发明新概念。
import type { CalculusPromptContract } from "./calculusRouteResultTypes";

export const ALLOWED_ENUMS = {
  RISK_LABEL: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  QA_STATUS: ["PASS", "WARN", "FAIL", "BLOCKED", "NOT_CHECKED"],
  CHAT_OUTPUT_TYPE: [
    "TEXT", "OBJECT", "APP", "CODE", "PATCH",
    "WORLD", "MUSIC", "CONCEPT", "KNOWLEDGE", "QA", "STORE", "SYSTEM",
  ],
  AUTHORITY_LEVEL: ["GUEST", "USER", "OPERATOR", "FOUNDER", "SYSTEM"],
  SOCIAL_VISIBILITY: ["PRIVATE", "UNLISTED", "PUBLIC", "FOUNDER_ONLY"],
} as const;

export function buildConstantsConstraintPrompt(contract: CalculusPromptContract): string {
  const lines: string[] = [];
  lines.push("【常数宇宙约束】");
  lines.push("以下枚举只能使用所列取值，禁止发明新词：");
  lines.push(`- 风险等级 RISK_LABEL：${ALLOWED_ENUMS.RISK_LABEL.join(" / ")}`);
  lines.push(`- QA 状态 QA_STATUS：${ALLOWED_ENUMS.QA_STATUS.join(" / ")}`);
  lines.push(`- 输出类型 CHAT_OUTPUT_TYPE：${ALLOWED_ENUMS.CHAT_OUTPUT_TYPE.join(" / ")}`);
  lines.push(`- 权限等级 AUTHORITY_LEVEL：${ALLOWED_ENUMS.AUTHORITY_LEVEL.join(" / ")}`);
  lines.push(`- 社交可见性 SOCIAL_VISIBILITY：${ALLOWED_ENUMS.SOCIAL_VISIBILITY.join(" / ")}`);
  if (contract.allowedOutputTypes.length) {
    lines.push(`- 本轮允许的输出类型仅限：${contract.allowedOutputTypes.join(" / ")}`);
  }
  return lines.join("\n");
}
