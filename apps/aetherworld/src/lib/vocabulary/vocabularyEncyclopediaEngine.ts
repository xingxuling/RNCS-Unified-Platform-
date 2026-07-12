import { VOCABULARY_REGISTRY, getCoreCounts, type VocabularyTerm } from "./vocabularyRegistry";
import { TERM_CATEGORIES } from "@/constants/vocabulary/termCategories";
import { TERM_SYSTEM_LAYERS } from "@/constants/vocabulary/termSystemLayers";
import { runTermAudit } from "./termAuditEngine";

export interface VocabularySummary {
  totalTerms: number;
  activeTerms: number;
  founderLockedTerms: number;
  deprecatedTerms: number;
  categories: number;
  systemLayers: number;
  auditIssues: number;
  staleCount: number;
  version: string;
}

export function getVocabularySummary(): VocabularySummary {
  const counts = getCoreCounts();
  const audit = runTermAudit(VOCABULARY_REGISTRY);
  return {
    ...counts,
    categories: TERM_CATEGORIES.length,
    systemLayers: TERM_SYSTEM_LAYERS.length,
    auditIssues: audit.length,
    staleCount: VOCABULARY_REGISTRY.filter((t) => t.localization.some((l) => l.stale)).length,
    version: "1.0.0",
  };
}

export function getTermsGroupedByCategory(): Record<string, VocabularyTerm[]> {
  const out: Record<string, VocabularyTerm[]> = {};
  for (const term of VOCABULARY_REGISTRY) {
    (out[term.category] ||= []).push(term);
  }
  return out;
}
