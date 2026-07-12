export type ExampleOutputFormat = "SUMMARY" | "STRUCTURED" | "PROMPT" | "COPY" | "ACTION_LIST";

export const EXAMPLE_OUTPUT_FORMATS: Record<ExampleOutputFormat, { label: string; description: string }> = {
  SUMMARY:     { label: "摘要",      description: "一段简明结果" },
  STRUCTURED:  { label: "结构化",    description: "分项条目" },
  PROMPT:      { label: "Prompt",    description: "可复制 AI 指令" },
  COPY:        { label: "文案",      description: "可发布内容" },
  ACTION_LIST: { label: "行动清单",  description: "下一步动作列表" },
};
