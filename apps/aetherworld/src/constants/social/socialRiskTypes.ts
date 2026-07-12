export const SOCIAL_RISK_TYPES = {
  FULL60_LEAK: { id: "FULL60_LEAK", label: "Full60 原始数列", severity: "BLOCK" },
  FOUNDER_LEAK: { id: "FOUNDER_LEAK", label: "Founder 专属数据", severity: "BLOCK" },
  SECRET_LEAK: { id: "SECRET_LEAK", label: "密钥 / Token / 密码", severity: "BLOCK" },
  WORKSPACE_DUMP: { id: "WORKSPACE_DUMP", label: "私密 Workspace 完整 Dump", severity: "BLOCK" },
  UNAUDITED_CODE: { id: "UNAUDITED_CODE", label: "未审计代码", severity: "WARN" },
  DANGEROUS_COMMAND: { id: "DANGEROUS_COMMAND", label: "高危命令", severity: "BLOCK" },
  IP_INFRINGEMENT: { id: "IP_INFRINGEMENT", label: "明显侵权内容", severity: "WARN" },
  FAKE_SOURCE: { id: "FAKE_SOURCE", label: "伪造来源", severity: "WARN" },
  HIGH_RISK_DOMAIN: { id: "HIGH_RISK_DOMAIN", label: "医疗 / 法律 / 金融断言", severity: "WARN" },
  REALITY_CONFUSION: { id: "REALITY_CONFUSION", label: "虚拟内容写成事实", severity: "WARN" },
} as const;

export type SocialRiskType = keyof typeof SOCIAL_RISK_TYPES;
