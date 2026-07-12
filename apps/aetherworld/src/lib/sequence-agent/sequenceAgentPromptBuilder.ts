// 数列 Agent System Prompt 片段构造
import type { SequenceAgent } from "./sequenceAgentTypes";

export function buildAgentPromptFragment(agent: SequenceAgent): string {
  const lines = [
    `# ${agent.cnName}（${agent.agentType}）`,
    `定位：${agent.description}`,
    `职责：${agent.domain.join("、")}`,
    agent.allowedTools.length ? `允许：${agent.allowedTools.join("、")}` : "",
    agent.deniedTools.length ? `禁止：${agent.deniedTools.join("、")}` : "",
    "请以本 Agent 视角给出简明、可执行的建议。不输出推理链。不做承诺。中文输出。",
  ].filter(Boolean);
  return lines.join("\n");
}

export function buildPanelPromptFragment(agents: SequenceAgent[]): string {
  return [
    "# 多 Agent 评审模式",
    `参与 Agent：${agents.map((a) => a.cnName).join("、")}`,
    "请逐 Agent 输出一段简明摘要（≤2 行），随后给出 Coordinator 综合结论。",
    "若 Agent 间存在分歧，明确标注「分歧」。",
  ].join("\n");
}
