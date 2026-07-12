import { VOCABULARY_REGISTRY, type VocabularyTerm } from "./vocabularyRegistry";
import type { TermUsageExample } from "./vocabularyRegistry";

/** 当词条未提供 exampleUsages 时，根据定义生成兜底示例。 */
export function getOrGenerateExamples(term: VocabularyTerm): TermUsageExample[] {
  if (term.exampleUsages && term.exampleUsages.length) return term.exampleUsages;
  return [
    {
      exampleId: `ex_${term.termId}_1`,
      inputContext: `用户在 Aetherworld 中提到「${term.chineseTerm}」`,
      correctUsage: `把 ${term.chineseTerm} 解释为：${term.shortDefinition}`,
      incorrectUsage: term.commonMisuse?.[0],
      explanation: term.safetyBoundary,
    },
  ];
}

export function getExamplesByTermId(termId: string): TermUsageExample[] {
  const term = VOCABULARY_REGISTRY.find((t) => t.termId === termId);
  return term ? getOrGenerateExamples(term) : [];
}
