// 数列 Agent 权限护栏
import type { SequenceAgent } from "./sequenceAgentTypes";

export interface PermissionDecision {
  allowed: boolean;
  reason?: string;
}

const HIGH_RISK_TOOLS = [
  "执行 shell",
  "公开发布",
  "支付",
  "真实部署",
  "删除文件",
  "绕过 Secret Guard",
  "绕过 QA 流程",
];

export function checkToolPermission(
  agent: SequenceAgent,
  toolName: string
): PermissionDecision {
  if (agent.deniedTools.some((t) => toolName.includes(t))) {
    return { allowed: false, reason: `Agent ${agent.cnName} 禁止使用「${toolName}」。` };
  }
  if (HIGH_RISK_TOOLS.some((t) => toolName.includes(t))) {
    return { allowed: false, reason: `「${toolName}」属高风险动作，需走 Scheduler 待确认。` };
  }
  return { allowed: true };
}

export function isFounderOnly(agent: SequenceAgent): boolean {
  return agent.authorityLevel === "FOUNDER_ONLY";
}
