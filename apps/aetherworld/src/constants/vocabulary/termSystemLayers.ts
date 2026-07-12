export const TERM_SYSTEM_LAYERS = [
  { id: "USER_LAYER",       label: "用户入口层" },
  { id: "SUBJECT_LAYER",    label: "主体数列层" },
  { id: "LANGUAGE_LAYER",   label: "MSL / 语言层" },
  { id: "CALCULUS_LAYER",   label: "计算法层" },
  { id: "ENGINE_LAYER",     label: "引擎层" },
  { id: "WORLD_LAYER",      label: "世界层" },
  { id: "GOVERNANCE_LAYER", label: "治理层" },
  { id: "KNOWLEDGE_LAYER",  label: "知识层" },
  { id: "UI_LAYER",         label: "界面层" },
  { id: "DOCS_LAYER",       label: "教学文档层" },
  { id: "TEXT_LAYER",       label: "应用文本层" },
  { id: "VERSION_LAYER",    label: "版本治理层" },
  { id: "QUALITY_LAYER",    label: "QA / Recalculation 层" },
  { id: "SAFETY_LAYER",     label: "安全边界层" },
  { id: "FOUNDER_LAYER",    label: "Founder 层" },
] as const;
export type TermSystemLayerId = (typeof TERM_SYSTEM_LAYERS)[number]["id"];
