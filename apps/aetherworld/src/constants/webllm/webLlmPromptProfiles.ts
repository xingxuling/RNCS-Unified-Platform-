export const WEB_LLM_PROMPT_PROFILES = [
  { id: "SEQUENCE_AI_CHAT",    label: "数列 AI 对话",   outputContract: ["plain", "structured"] },
  { id: "APP_RUNTIME_DRAFT",   label: "App Runtime 草案", outputContract: ["files", "readme"] },
  { id: "CODE_REPAIR",         label: "代码修复",       outputContract: ["patch", "explanation"] },
  { id: "NARRATIVE_DRAFT",     label: "剧情草案",       outputContract: ["paragraphs"] },
  { id: "VOCAL_LYRICS",        label: "歌词草案",       outputContract: ["lyrics", "prompt"] },
  { id: "DOCS_WRITER",         label: "文档撰写",       outputContract: ["markdown"] },
  { id: "GENERIC",             label: "通用",          outputContract: ["plain"] },
] as const;
export type WebLlmPromptProfileId = typeof WEB_LLM_PROMPT_PROFILES[number]["id"];
