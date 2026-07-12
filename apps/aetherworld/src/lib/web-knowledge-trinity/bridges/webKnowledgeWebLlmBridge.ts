import type { WebLcmInputFromKnowledgeTrinity } from "./webKnowledgeWebLcmBridge";

export interface WebLlmPromptFromTrinity {
  systemPrompt: string;
  userPrompt: string;
  outputContract: string[];
  allowedToSendRawKnowledge: false;
}

export function buildWebLlmPrompt(input: WebLcmInputFromKnowledgeTrinity): WebLlmPromptFromTrinity {
  const sysParts = [
    "你是 Aether 本地语言器官，必须遵守以下约束：",
    "- 规则层优先：禁止覆盖计算法结论；",
    "- 不得输出危险代码；",
    "- 不得把虚拟世界写成现实；",
    "- 必须可被 QA 检查。",
    "应用常数约束：" + input.constantConstraints.join(", "),
    "已选计算法路线：" + input.calculusRouteSummary,
  ];
  const userParts = [
    "用户意图：" + input.userIntent,
    "输出目标：" + input.outputGoal,
    "知识摘要（仅参考，不引用原文）：",
    ...input.knowledgeSummaries.map((s) => "- " + s),
  ];
  return {
    systemPrompt: sysParts.join("\n"),
    userPrompt: userParts.join("\n"),
    outputContract: ["STRUCTURED", "QA_REQUIRED", "WORKSPACE_TRACE"],
    allowedToSendRawKnowledge: false,
  };
}
