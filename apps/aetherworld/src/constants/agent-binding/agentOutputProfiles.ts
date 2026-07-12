export const AGENT_OUTPUT_PROFILES = [
  { id: "PUBLIC_SUMMARY",   label: "公开摘要" },
  { id: "ADVANCED_TRACE",   label: "高级结构信息" },
  { id: "FOUNDER_TRACE",    label: "Founder 完整路径" },
] as const;

export type AgentOutputProfileId = typeof AGENT_OUTPUT_PROFILES[number]["id"];
