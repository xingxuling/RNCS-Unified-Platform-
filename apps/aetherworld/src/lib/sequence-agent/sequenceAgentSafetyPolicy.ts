// 数列 Agent 安全策略
import type { SequenceAgent, AgentSafetyStatus } from "./sequenceAgentTypes";

const FORBIDDEN_SHELL = /(rm\s+-rf|sudo|chmod\s+777|curl[^\n]*\|\s*sh|wget[^\n]*\|\s*sh)/i;
const REAL_PAYMENT = /(真实支付|实际付款|银行转账|wire\s*transfer)/i;
const REAL_DEPLOY = /(自动部署到生产|强制公开发布|无确认发布)/i;
const FULL60_HINT = /(Full60\s*原始|完整数列\s*泄露)/i;
const FOUNDER_LEAK = /(founder[-_ ]?only\s*原文|创始人专属\s*原文)/i;

export function checkAgentSafety(
  agent: SequenceAgent,
  input: string
): { status: AgentSafetyStatus; notes: string[] } {
  const notes: string[] = [];
  let status: AgentSafetyStatus = "PASS";

  if (FORBIDDEN_SHELL.test(input)) {
    notes.push("禁止执行高危 shell 命令。");
    status = "BLOCK";
  }
  if (REAL_PAYMENT.test(input)) {
    notes.push("禁止真实支付 / 金融转账。");
    status = "BLOCK";
  }
  if (REAL_DEPLOY.test(input)) {
    notes.push("禁止无确认部署 / 公开发布。");
    status = "BLOCK";
  }
  if (FULL60_HINT.test(input) || FOUNDER_LEAK.test(input)) {
    notes.push("禁止输出 Full60 / Founder-only 原文。");
    status = "BLOCK";
  }

  if (agent.authorityLevel === "FOUNDER_ONLY") {
    notes.push("Founder-only Agent：高权限操作需 Founder 确认。");
    if (status === "PASS") status = "WARN";
  }
  if (agent.safetyLevel === "HIGH" && status === "PASS") {
    notes.push("高敏感 Agent：动作默认进入待确认。");
    status = "WARN";
  }

  return { status, notes };
}
