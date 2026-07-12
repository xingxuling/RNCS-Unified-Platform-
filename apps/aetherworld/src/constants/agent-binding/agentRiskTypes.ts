export const AGENT_RISK_TYPES = [
  { id: "CONTEXT_DRIFT",        label: "上下文漂移",   severity: "MEDIUM" },
  { id: "ROLE_CONFUSION",       label: "角色混乱",     severity: "MEDIUM" },
  { id: "PERSONALITY_LEAKAGE",  label: "人格泄漏",     severity: "HIGH" },
  { id: "UNSAFE_AUTONOMY",      label: "不安全自主",   severity: "CRITICAL" },
  { id: "TOOL_MISUSE",          label: "工具误用",     severity: "HIGH" },
  { id: "KNOWLEDGE_MISMATCH",   label: "知识错配",     severity: "MEDIUM" },
  { id: "FULL60_LEAK",          label: "Full60 泄漏",  severity: "CRITICAL" },
  { id: "FOUNDER_LEAK",         label: "Founder 泄漏", severity: "CRITICAL" },
  { id: "DANGEROUS_CODE",       label: "危险代码",     severity: "CRITICAL" },
  { id: "UNCONFIRMED_DEPLOY",   label: "未确认部署",   severity: "CRITICAL" },
  { id: "FAKE_SOURCE",          label: "伪造来源",     severity: "HIGH" },
  { id: "REALITY_CONFUSION",    label: "虚拟现实混淆", severity: "HIGH" },
] as const;

export type AgentRiskTypeId = typeof AGENT_RISK_TYPES[number]["id"];
