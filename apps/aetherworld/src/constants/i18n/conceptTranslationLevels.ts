export type ConceptTranslationLevel = "PLAIN_USER" | "STRUCTURED_USER" | "FOUNDER_TECHNICAL";

export const CONCEPT_TRANSLATION_LEVELS: { level: ConceptTranslationLevel; zh: string; description: string }[] = [
  { level: "PLAIN_USER",         zh: "普通用户语言",   description: "少术语，直接说用途。" },
  { level: "STRUCTURED_USER",    zh: "结构用户语言",   description: "可使用变量、边界、阶段、行动许可等词。" },
  { level: "FOUNDER_TECHNICAL",  zh: "创始人/开发者",  description: "可使用 Engine / Calculus / Compiler / Protocol。" },
];

export function levelFromMode(mode: "beginner" | "advanced" | "founder"): ConceptTranslationLevel {
  if (mode === "founder") return "FOUNDER_TECHNICAL";
  if (mode === "advanced") return "STRUCTURED_USER";
  return "PLAIN_USER";
}
