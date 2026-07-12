import { PRODUCT_TERMS, ProductTerm, findTerm } from "@/constants/i18n/productTerminology";
import { LanguageCode } from "@/constants/i18n/supportedLanguages";

export function translateTerm(termId: string, lang: LanguageCode): string | undefined {
  const t = findTerm(termId);
  return t?.translations[lang];
}

export function listTerms(): ProductTerm[] {
  return PRODUCT_TERMS;
}

/** Look up a term by source text in any language and translate to target. */
export function translateBySurface(text: string, targetLang: LanguageCode): { hit: boolean; text: string; termId?: string } {
  const trimmed = text.trim();
  for (const term of PRODUCT_TERMS) {
    for (const v of Object.values(term.translations)) {
      if (v === trimmed) {
        return { hit: true, text: term.translations[targetLang] ?? text, termId: term.id };
      }
    }
  }
  return { hit: false, text };
}

/** Check whether two surface labels resolve to the same term. */
export function isSameTerm(a: string, b: string): boolean {
  const ta = PRODUCT_TERMS.find(t => Object.values(t.translations).includes(a.trim()));
  const tb = PRODUCT_TERMS.find(t => Object.values(t.translations).includes(b.trim()));
  return !!ta && ta.id === tb?.id;
}

export function exportTerminologyJSON(): string {
  return JSON.stringify(PRODUCT_TERMS, null, 2);
}

export function exportLanguageBundle(lang: LanguageCode): string {
  const bundle: Record<string, string> = {};
  for (const t of PRODUCT_TERMS) {
    bundle[t.id] = t.translations[lang] ?? t.translations.en;
  }
  return JSON.stringify(bundle, null, 2);
}
