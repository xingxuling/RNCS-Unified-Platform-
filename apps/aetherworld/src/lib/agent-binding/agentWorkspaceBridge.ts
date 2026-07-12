import type { AetherAgentOutput } from "./agentOutputAdapter";

export interface AgentWorkspaceSaveResult {
  recordId: string;
  saved: boolean;
  reason: string;
}

export function saveAgentOutputToWorkspace(output: AetherAgentOutput): AgentWorkspaceSaveResult {
  return {
    recordId: `ws-agentbind-${output.outputId}`,
    saved: true,
    reason: `已保存 Agent 绑定输出（草案级）；通过 QA 与人工确认后可发布`,
  };
}
