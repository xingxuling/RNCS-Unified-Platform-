// 数列 Agent 主运行时（轻量、确定性）
// 不直接发起新的 LLM 调用，避免与 Chat 主链路重复计费。
// 角色化输出由结构化模板 + 现场上下文产生，作为 Chat 结果卡的 Agent 摘要。
import { newAgentRunId } from "./sequenceAgentIds";
import { checkAgentSafety } from "./sequenceAgentSafetyPolicy";
import type {
  AgentCollabMode,
  AgentPanelResult,
  SequenceAgent,
  SequenceAgentRun,
} from "./sequenceAgentTypes";

export interface AgentRuntimeContext {
  rawInput: string;
  chatSessionId?: string;
  fusionDomains?: string[];
  calculusId?: string;
  predictionRiskLevel?: string;
  memoryUnitCount?: number;
  currencyEventId?: string;
  mslFrameId?: string;
}

function summarizeAgent(agent: SequenceAgent, ctx: AgentRuntimeContext): string {
  const input = ctx.rawInput.trim().slice(0, 60);
  switch (agent.agentType) {
    case "ARCHITECT":
      return `从架构视角：「${input}」建议先评估模块归位，再决定是否新建桥接层；优先复用 legacy-modules 与 cross-domain-fusion。`;
    case "PRODUCT":
      return `从产品视角：「${input}」需明确目标用户与最小可用价值，避免增加首页复杂度；建议接入既有 Workspace / Chat 结果卡。`;
    case "CODE":
      return `从代码视角：可在 Code Sandbox 出 Patch 草案，最终走 Handoff Pack。禁止直接修改生产文件。`;
    case "QA":
      return `从 QA 视角：建议补充回归用例并写入 Bug Audit；当前未发现 BLOCKER；P0/P1 待确认。`;
    case "SECURITY":
      return `从安全视角：动作若涉及公开 / 发布 / 支付 / Founder-only / Full60，需走待确认；默认拒绝绕过 Secret Guard。`;
    case "PREDICTION":
      return `从预测视角：${ctx.predictionRiskLevel ? `当前风险等级 ${ctx.predictionRiskLevel}；` : ""}建议生成至少 3 条未来轨迹与复查节点。`;
    case "MEMORY":
      return `从记忆视角：${ctx.memoryUnitCount ? `已注入 ${ctx.memoryUnitCount} 条记忆单元；` : ""}可压缩本轮上下文作为长期记忆。`;
    case "WORLD":
      return `从世界视角：可调用 World → Narrative → Vocal 生成草案；输出仅作创作草案，不做版权承诺。`;
    case "SCHEDULER":
      return `从调度视角：建议拆解为 AetherTask；高风险动作进入 WAITING_CONFIRMATION。`;
    case "ANALYTICS":
      return `从统计视角：可读取 Value Ledger 与模型延迟，给出 Agent / 模型 / 模块排行草案。`;
    case "SOCIAL":
      return `从社交视角：发布前需安全 Agent 复核；公开范围默认私密。`;
    default:
      return `${agent.cnName} 摘要：${input}`;
  }
}

export function runSingleAgent(
  agent: SequenceAgent,
  ctx: AgentRuntimeContext
): SequenceAgentRun {
  const safety = checkAgentSafety(agent, ctx.rawInput);
  const output = safety.status === "BLOCK"
    ? `已阻断：${safety.notes.join("；")}`
    : summarizeAgent(agent, ctx);
  return {
    id: newAgentRunId(),
    agentId: agent.id,
    chatSessionId: ctx.chatSessionId,
    input: ctx.rawInput,
    output,
    status: safety.status === "BLOCK" ? "BLOCKED" : "SUCCESS",
    usedTools: [],
    memoryUnitIds: [],
    currencyEventId: ctx.currencyEventId,
    mslFrameId: ctx.mslFrameId,
    safetyStatus: safety.status,
    createdAt: new Date().toISOString(),
  };
}

export function runAgentPanel(
  agents: SequenceAgent[],
  mode: AgentCollabMode,
  ctx: AgentRuntimeContext
): AgentPanelResult {
  const runs = agents.map((a) => runSingleAgent(a, ctx));
  // 冲突检测：产品 vs 安全 / 架构 vs 产品 在涉及发布 / 公开 场景容易冲突
  const types = new Set(agents.map((a) => a.agentType));
  let conflictNote: string | undefined;
  if (types.has("PRODUCT") && types.has("SECURITY") && /公开|发布|社交|开放/.test(ctx.rawInput)) {
    conflictNote = "存在 Agent 分歧：产品 Agent 倾向开放，安全 Agent 倾向暂缓公开发布。";
  }
  const conclusion = mode === "SINGLE_AGENT"
    ? runs[0]?.output ?? "无可用 Agent。"
    : `综合 ${agents.length} 个 Agent 的意见，建议${conflictNote ? "先暂缓高风险动作，待确认后再推进" : "按上述要点分步推进"}。`;
  const nextSteps = [
    "可让调度 Agent 拆解为 AetherTask（默认待确认）。",
    "可让记忆 Agent 写入本轮长期记忆。",
    "可让 QA Agent 复核风险与回归点。",
  ];
  const riskNotes = runs.flatMap((r) =>
    r.safetyStatus !== "PASS" ? [`${r.agentId}: ${r.output}`] : []
  );
  return { mode, runs, coordinatorConclusion: conclusion, conflictNote, nextSteps, riskNotes };
}
