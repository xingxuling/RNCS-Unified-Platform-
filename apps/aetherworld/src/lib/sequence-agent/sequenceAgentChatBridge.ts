// Chat 接入：根据用户输入决定是否触发 Agent，并返回 ChatAgentInfo 摘要
import { routeAgents } from "./sequenceAgentRouter";
import { coordinateAgents } from "./sequenceAgentCoordinator";
import {
  bridgeAgentAnalytics,
  bridgeAgentCurrency,
  bridgeAgentMsl,
  bridgeAgentScheduler,
  bridgePanelMsl,
} from "./sequenceAgentBridges";
import {
  AGENT_TYPE_LABEL,
  COLLAB_MODE_LABEL,
  type AgentCollabMode,
  type SequenceAgentType,
} from "./sequenceAgentTypes";

export interface ChatAgentSummaryItem {
  agentId: string;
  cnName: string;
  agentType: SequenceAgentType;
  agentTypeLabel: string;
  output: string;
  safetyStatus: "PASS" | "WARN" | "BLOCK";
}

export interface ChatAgentInfo {
  triggered: boolean;
  mode: AgentCollabMode;
  modeLabel: string;
  reason: string;
  items: ChatAgentSummaryItem[];
  coordinatorConclusion: string;
  conflictNote?: string;
  nextSteps: string[];
  riskNotes: string[];
  mslLines: string[];
  schedulerSuggestions: Array<{ agent: string; taskType: string; needsConfirmation: boolean }>;
}

export interface BuildChatAgentInfoParams {
  rawInput: string;
  chatSessionId?: string;
  calculusId?: string;
  isPrediction?: boolean;
  predictionRiskLevel?: string;
  memoryUnitCount?: number;
  currencyEventId?: string;
  mslFrameId?: string;
}

export function buildChatAgentInfo(p: BuildChatAgentInfoParams): ChatAgentInfo | undefined {
  const decision = routeAgents({
    rawInput: p.rawInput,
    calculusId: p.calculusId,
    isPrediction: p.isPrediction,
  });
  if (decision.agents.length === 0) return undefined;

  const panel = coordinateAgents(decision.agents, decision.mode, {
    rawInput: p.rawInput,
    chatSessionId: p.chatSessionId,
    calculusId: p.calculusId,
    predictionRiskLevel: p.predictionRiskLevel,
    memoryUnitCount: p.memoryUnitCount,
    currencyEventId: p.currencyEventId,
    mslFrameId: p.mslFrameId,
  });

  const items: ChatAgentSummaryItem[] = panel.runs.map((r) => {
    const a = panel.agents.find((x) => x.id === r.agentId)!;
    return {
      agentId: a.id,
      cnName: a.cnName,
      agentType: a.agentType,
      agentTypeLabel: AGENT_TYPE_LABEL[a.agentType],
      output: r.output,
      safetyStatus: r.safetyStatus,
    };
  });

  // 计量 + MSL（仅返回摘要供 UI 展示，避免双写）
  const mslLines = panel.runs.map((r) => {
    const a = panel.agents.find((x) => x.id === r.agentId)!;
    return bridgeAgentMsl(a, r).line;
  });
  if (panel.runs.length > 1) {
    mslLines.push(bridgePanelMsl(panel.agents, panel.conflictNote).line);
  }
  // analytics / currency 计算（不持久化，仅占位）
  panel.runs.forEach((r) => {
    const a = panel.agents.find((x) => x.id === r.agentId);
    if (!a) return;
    bridgeAgentAnalytics(a, r);
    bridgeAgentCurrency(a, r);
  });

  const schedulerSuggestions = panel.agents.map((a) => {
    const b = bridgeAgentScheduler(a);
    return { agent: a.cnName, taskType: b.suggestedTaskType, needsConfirmation: b.needsConfirmation };
  });

  return {
    triggered: true,
    mode: panel.mode,
    modeLabel: COLLAB_MODE_LABEL[panel.mode],
    reason: decision.reason,
    items,
    coordinatorConclusion: panel.coordinatorConclusion,
    conflictNote: panel.conflictNote,
    nextSteps: panel.nextSteps,
    riskNotes: panel.riskNotes,
    mslLines,
    schedulerSuggestions,
  };
}
