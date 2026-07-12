export const CHAT_SAFETY_RULES = [
  { id: "NO_REAL_EXECUTION", text: "不把模拟当真实执行。" },
  { id: "NO_DANGEROUS_AUTO", text: "高风险操作必须用户确认，不自动执行。" },
  { id: "NO_BYPASS_WEBXXM", text: "不绕过 WebXXM 安装与启用机制。" },
  { id: "NO_BYPASS_QA", text: "不绕过 QA。" },
  { id: "NO_FOUNDER_LEAK", text: "不泄漏 Founder-only 内容。" },
  { id: "NO_FULL60_LEAK", text: "不泄漏 Full60 原始数列。" },
  { id: "NO_FAKE_DATA", text: "不伪造外部数据。" },
] as const;

export const CHAT_BLOCK_KEYWORDS = [
  "full60 raw", "原始 full60", "founder-only secret", "rm -rf /", "drop database",
];
