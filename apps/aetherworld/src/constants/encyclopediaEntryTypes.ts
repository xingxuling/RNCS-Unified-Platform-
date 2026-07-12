// 百科条目类型
export type EncyclopediaEntryType =
  | "CONCEPT" | "MODULE" | "CALCULUS" | "CONSTANT" | "EVENT"
  | "USER_MODE" | "SAFETY_RULE" | "WORKFLOW" | "PAGE" | "PROMPT_TEMPLATE";

export const ENTRY_TYPE_LABELS: Record<EncyclopediaEntryType, string> = {
  CONCEPT: "概念",
  MODULE: "模块",
  CALCULUS: "计算法",
  CONSTANT: "常数",
  EVENT: "事件",
  USER_MODE: "用户模式",
  SAFETY_RULE: "安全规则",
  WORKFLOW: "流程",
  PAGE: "页面",
  PROMPT_TEMPLATE: "提示词模板",
};

export const ENTRY_TYPE_COLORS: Record<EncyclopediaEntryType, string> = {
  CONCEPT: "text-sky-300 border-sky-500/40",
  MODULE: "text-violet-300 border-violet-500/40",
  CALCULUS: "text-amber-300 border-amber-500/40",
  CONSTANT: "text-emerald-300 border-emerald-500/40",
  EVENT: "text-pink-300 border-pink-500/40",
  USER_MODE: "text-cyan-300 border-cyan-500/40",
  SAFETY_RULE: "text-red-300 border-red-500/40",
  WORKFLOW: "text-lime-300 border-lime-500/40",
  PAGE: "text-blue-300 border-blue-500/40",
  PROMPT_TEMPLATE: "text-fuchsia-300 border-fuchsia-500/40",
};
