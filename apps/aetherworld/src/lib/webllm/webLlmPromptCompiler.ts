import type { WebLlmPromptProfileId } from "@/constants/webllm/webLlmPromptProfiles";

export interface WebLlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface WebLlmPromptContext {
  taskType: WebLlmPromptProfileId | string;
  subjectMode: string;
  subjectPersonalitySummary?: Record<string, unknown>;
  knowledgeSummary: Record<string, unknown>;
  calculusStructure: Record<string, unknown>;
  objectInputs: Record<string, unknown>[];
  neuroControlProfile: string;
  systemConstitutionRules: string[];
  outputContract: string[];
  forbiddenContent: string[];
}

export function compilePrompt(ctx: WebLlmPromptContext, userInput: string): WebLlmMessage[] {
  const sys = [
    "[Aetherworld Boundary]",
    "你是 Aetherworld 的本地 WebLLM 辅助层，不是最终决策者。",
    "必须服从计算法结构、System Constitution、QA。",
    "你的输出将进入神经启发控制层与 QA 检查。",
    "",
    "[Subject Mode] " + ctx.subjectMode,
    "[Neuro Control] " + ctx.neuroControlProfile,
    "",
    "[Calculus Structure]",
    safeJson(ctx.calculusStructure),
    "",
    "[Knowledge Summary]",
    safeJson(ctx.knowledgeSummary),
    "",
    "[Subject Personality Summary]",
    ctx.subjectPersonalitySummary ? safeJson(ctx.subjectPersonalitySummary) : "(无)",
    "",
    "[System Constitution Rules]",
    ctx.systemConstitutionRules.map((r) => "- " + r).join("\n"),
    "",
    "[Output Contract]",
    ctx.outputContract.map((c) => "- " + c).join("\n"),
    "",
    "[Forbidden Content]",
    ctx.forbiddenContent.map((c) => "- " + c).join("\n"),
  ].join("\n");

  return [
    { role: "system", content: sys },
    { role: "user", content: userInput },
  ];
}

function safeJson(obj: unknown): string {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

export function previewPrompt(ctx: WebLlmPromptContext, userInput: string): string {
  return compilePrompt(ctx, userInput).map((m) => `### ${m.role}\n${m.content}`).join("\n\n");
}
