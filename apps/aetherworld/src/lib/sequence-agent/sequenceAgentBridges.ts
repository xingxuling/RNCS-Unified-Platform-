// Agent 与 Sequence Memory / Currency / MSL / Scheduler / Workspace / Analytics / QA 的桥接
// 全部为轻量预留：仅做计量打点与摘要，不真正写入跨模块持久层（由原有 Bridge 处理）。
import type { SequenceAgentRun, SequenceAgent } from "./sequenceAgentTypes";

export function bridgeAgentMemory(run: SequenceAgentRun): { unitIds: string[] } {
  // 占位：实际记忆写入由 Sequence Memory Bridge 处理；这里仅返回引用
  return { unitIds: run.memoryUnitIds };
}

export function bridgeAgentCurrency(
  agent: SequenceAgent,
  run: SequenceAgentRun
): { agentId: string; events: number; cost: number } {
  // 占位：实际写入由 sequenceCurrencyChatBridge 处理；此处只计数
  return {
    agentId: agent.id,
    events: 1,
    cost: run.safetyStatus === "PASS" ? 1 : 0.5,
  };
}

export function bridgeAgentMsl(
  agent: SequenceAgent,
  run: SequenceAgentRun
): { mslId: string; line: string } {
  const line = `MSL::AGENT_RUN @agent=${agent.id} @status=${run.status} @safety=${run.safetyStatus}`;
  return { mslId: run.id, line };
}

export function bridgePanelMsl(
  agents: SequenceAgent[],
  conflict?: string
): { mslId: string; line: string } {
  const ids = agents.map((a) => a.id).join(",");
  return {
    mslId: `panel-${Date.now().toString(36)}`,
    line: `MSL::AGENT_PANEL @agents=${ids} @status=SUCCESS @conflict=${conflict ? "WARN" : "NONE"}`,
  };
}

export function bridgeAgentScheduler(
  agent: SequenceAgent
): { suggestedTaskType: string; needsConfirmation: boolean } {
  const type = agent.agentType === "CODE"
    ? "CODE_REPAIR"
    : agent.agentType === "QA"
    ? "QA_AUDIT"
    : agent.agentType === "WORLD"
    ? "WORLD_CREATION"
    : "AGENT_REVIEW";
  return {
    suggestedTaskType: type,
    needsConfirmation: agent.safetyLevel === "HIGH" || agent.authorityLevel === "FOUNDER_ONLY",
  };
}

export function bridgeAgentWorkspace(run: SequenceAgentRun): { objectKind: string } {
  return { objectKind: "AGENT_RUN_NOTE" };
}

export function bridgeAgentAnalytics(
  agent: SequenceAgent,
  run: SequenceAgentRun
): { agentId: string; agentType: string; status: string; safety: string } {
  return {
    agentId: agent.id,
    agentType: agent.agentType,
    status: run.status,
    safety: run.safetyStatus,
  };
}

export function bridgeAgentQa(
  run: SequenceAgentRun
): { qaStatus: "PASS" | "WARN" | "BLOCK" } {
  return { qaStatus: run.safetyStatus };
}
