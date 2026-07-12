export type SequenceAIMode =
  | "AUTO" | "ASK" | "CREATE" | "WORLD" | "NARRATIVE" | "VOCAL" | "TRANSLATE" | "CODE" | "QA" | "FOUNDER";

export const SEQUENCE_AI_MODES: { id: SequenceAIMode; label: string; en: string; hint: string }[] = [
  { id: "AUTO",      label: "自动",   en: "Auto",       hint: "由系统判断意图并路由。" },
  { id: "ASK",       label: "问事",   en: "Ask",        hint: "决策、分析、破解。" },
  { id: "CREATE",    label: "创造",   en: "Create",     hint: "生成模型、虚拟生活、创造物。" },
  { id: "WORLD",     label: "世界",   en: "World",      hint: "区域、NPC、任务、地图。" },
  { id: "NARRATIVE", label: "剧情",   en: "Narrative",  hint: "小说、漫画、任务文本。" },
  { id: "VOCAL",     label: "声乐",   en: "Vocal",      hint: "声线、歌曲、AI 音乐提示词。" },
  { id: "TRANSLATE", label: "翻译",   en: "Translate",  hint: "多语言本地化。" },
  { id: "CODE",      label: "代码",   en: "Code",       hint: "代码计划与提示词。" },
  { id: "QA",        label: "QA",     en: "QA",         hint: "审计、检查、重算。" },
  { id: "FOUNDER",   label: "创始人", en: "Founder",    hint: "权限/引擎注册（受限）。" },
];
