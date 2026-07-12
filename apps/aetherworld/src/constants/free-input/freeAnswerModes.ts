export type FreeAnswerMode =
  | "DIRECT_ANSWER" | "STRUCTURED_ANALYSIS" | "STEP_BY_STEP_PLAN"
  | "ENGINE_OUTPUT" | "PROMPT_OUTPUT" | "CREATIVE_OUTPUT"
  | "TECHNICAL_OUTPUT" | "MODEL_OUTPUT" | "QA_OUTPUT" | "MIXED_OUTPUT";

export const FREE_ANSWER_MODES: { id: FreeAnswerMode; label: string }[] = [
  { id: "DIRECT_ANSWER",       label: "直接回答" },
  { id: "STRUCTURED_ANALYSIS", label: "结构分析" },
  { id: "STEP_BY_STEP_PLAN",   label: "行动计划" },
  { id: "ENGINE_OUTPUT",       label: "引擎结果" },
  { id: "PROMPT_OUTPUT",       label: "提示词" },
  { id: "CREATIVE_OUTPUT",     label: "创作文本" },
  { id: "TECHNICAL_OUTPUT",    label: "技术方案" },
  { id: "MODEL_OUTPUT",        label: "模型输出" },
  { id: "QA_OUTPUT",           label: "审计输出" },
  { id: "MIXED_OUTPUT",        label: "混合输出" },
];
