export const WEBXXM_PACKAGE_SAFETY_RULES = [
  { id: "NO_FULL60_RAW",          severity: "CRITICAL", description: "禁止包含 Full60 原始数列。" },
  { id: "NO_UNMARKED_FOUNDER",    severity: "CRITICAL", description: "禁止包含未标记的 Founder-only 数据。" },
  { id: "NO_SECRETS",             severity: "CRITICAL", description: "禁止包含密钥/Token/密码。" },
  { id: "NO_DANGEROUS_COMMANDS",  severity: "HIGH",     description: "禁止声明危险命令权限。" },
  { id: "NO_QA_BYPASS",           severity: "HIGH",     description: "禁止绕过 QA。" },
  { id: "NO_WEBCOM_BYPASS",       severity: "HIGH",     description: "禁止绕过 WebCoM 边界。" },
  { id: "NO_CONSTITUTION_BYPASS", severity: "HIGH",     description: "禁止绕过 System Constitution。" },
  { id: "NO_PRO_VERDICT",         severity: "MEDIUM",   description: "禁止伪装成专业医疗/法律/金融裁决者。" },
  { id: "NO_AUTO_EXECUTE",        severity: "HIGH",     description: "禁止自动执行删除/部署/付款/发信。" },
  { id: "NO_REALITY_CLAIM",       severity: "MEDIUM",   description: "禁止把虚拟世界现实化。" },
] as const;
export type WebXXMPackageSafetyRuleId = typeof WEBXXM_PACKAGE_SAFETY_RULES[number]["id"];
