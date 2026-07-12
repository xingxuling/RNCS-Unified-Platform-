import { VOCABULARY_REGISTRY, type VocabularyTerm } from "./vocabularyRegistry";
import { TERM_LOCALES, type TermLocaleId } from "@/constants/vocabulary/termLocalizationLocales";

export interface LocalizationStatus {
  termId: string;
  chineseTerm: string;
  englishTerm: string;
  coverage: Record<TermLocaleId, "MISSING" | "OK" | "STALE">;
  staleCount: number;
  missingCount: number;
}

export function getLocalizationStatus(): LocalizationStatus[] {
  return VOCABULARY_REGISTRY.map((t) => {
    const coverage = {} as Record<TermLocaleId, "MISSING" | "OK" | "STALE">;
    let missing = 0, stale = 0;
    for (const loc of TERM_LOCALES) {
      const entry = t.localization.find((l) => l.locale === loc.id);
      if (!entry) { coverage[loc.id] = "MISSING"; missing++; }
      else if (entry.stale) { coverage[loc.id] = "STALE"; stale++; }
      else coverage[loc.id] = "OK";
    }
    return {
      termId: t.termId, chineseTerm: t.chineseTerm, englishTerm: t.englishTerm,
      coverage, staleCount: stale, missingCount: missing,
    };
  });
}

export function getTermLocalization(termId: string) {
  return VOCABULARY_REGISTRY.find((t) => t.termId === termId)?.localization ?? [];
}

/** 标记某语言为 stale。 */
export function markStale(term: VocabularyTerm, locale: TermLocaleId) {
  const entry = term.localization.find((l) => l.locale === locale);
  if (entry) entry.stale = true;
}
