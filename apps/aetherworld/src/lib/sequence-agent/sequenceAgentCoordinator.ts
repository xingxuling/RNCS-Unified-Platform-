// Coordinator：聚合 / 去重 / 冲突 / 输出 ChatDisplayResult
import type { AgentPanelResult, SequenceAgent } from "./sequenceAgentTypes";
import { runAgentPanel, type AgentRuntimeContext } from "./sequenceAgentRuntime";

export interface CoordinatorOutput extends AgentPanelResult {
  agents: SequenceAgent[];
}

export function coordinateAgents(
  agents: SequenceAgent[],
  mode: AgentPanelResult["mode"],
  ctx: AgentRuntimeContext
): CoordinatorOutput {
  const panel = runAgentPanel(agents, mode, ctx);
  // 去重：相同 agentType 仅保留首条
  const seenType = new Set<string>();
  const runs = panel.runs.filter((r) => {
    const a = agents.find((x) => x.id === r.agentId);
    if (!a) return false;
    if (seenType.has(a.agentType)) return false;
    seenType.add(a.agentType);
    return true;
  });
  return { ...panel, runs, agents };
}
