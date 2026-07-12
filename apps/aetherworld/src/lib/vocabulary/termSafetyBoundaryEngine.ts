import { VOCABULARY_REGISTRY, type VocabularyTerm } from "./vocabularyRegistry";

export function getSafetyBoundary(term: VocabularyTerm): string {
  return term.safetyBoundary || "属于 Aetherworld 产品内部概念，不代表现实事实。";
}

export function listHighRiskTerms(): VocabularyTerm[] {
  return VOCABULARY_REGISTRY.filter(
    (t) => t.category === "CURRENCY_TERM" || t.category === "SAFETY_TERM" || t.category === "GOVERNANCE_TERM",
  );
}
