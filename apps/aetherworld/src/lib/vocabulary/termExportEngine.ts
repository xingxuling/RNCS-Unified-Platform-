import { VOCABULARY_REGISTRY } from "./vocabularyRegistry";

export type VocabularyExportTarget = "json" | "glossary" | "markdown";

export function exportVocabulary(target: VocabularyExportTarget): string {
  if (target === "json") return JSON.stringify(VOCABULARY_REGISTRY, null, 2);
  if (target === "glossary") {
    return VOCABULARY_REGISTRY
      .map((t) => `${t.chineseTerm} (${t.englishTerm}) — ${t.shortDefinition}`)
      .join("\n");
  }
  // markdown
  return VOCABULARY_REGISTRY
    .map((t) =>
      `### ${t.chineseTerm} / ${t.englishTerm}\n` +
      `- 分类: ${t.category}\n- 系统层: ${t.systemLayer}\n` +
      `- 一句话: ${t.shortDefinition}\n- 普通解释: ${t.plainDefinition}\n` +
      `- 安全边界: ${t.safetyBoundary}\n`,
    )
    .join("\n");
}
