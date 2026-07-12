import { PRODUCT_TERMS } from "@/constants/i18n/productTerminology";
import { LanguageCode, SUPPORTED_LANGUAGES } from "@/constants/i18n/supportedLanguages";

export interface UntranslatedReport {
  totalTerms: number;
  perLanguage: Record<LanguageCode, { missing: number; missingIds: string[] }>;
  markdown: string;
}

export function checkConsistency(): UntranslatedReport {
  const perLanguage = {} as UntranslatedReport["perLanguage"];
  for (const lang of SUPPORTED_LANGUAGES) {
    perLanguage[lang.code] = { missing: 0, missingIds: [] };
  }
  for (const term of PRODUCT_TERMS) {
    for (const lang of SUPPORTED_LANGUAGES) {
      const v = term.translations[lang.code];
      if (!v || !v.trim()) {
        perLanguage[lang.code].missing++;
        perLanguage[lang.code].missingIds.push(term.id);
      }
    }
  }
  const md =
    `# Untranslated Keys Report\n\n` +
    `Total terms: ${PRODUCT_TERMS.length}\n\n` +
    SUPPORTED_LANGUAGES.map(l => {
      const r = perLanguage[l.code];
      return `- ${l.code} (${l.nativeName}): missing ${r.missing}${r.missing ? ` — ${r.missingIds.join(", ")}` : ""}`;
    }).join("\n");
  return { totalTerms: PRODUCT_TERMS.length, perLanguage, markdown: md };
}

export interface TerminologyConsistencyReport {
  duplicateSurfaces: { surface: string; termIds: string[] }[];
  markdown: string;
}

export function checkTerminologyConsistency(): TerminologyConsistencyReport {
  const seen = new Map<string, string[]>();
  for (const term of PRODUCT_TERMS) {
    for (const v of Object.values(term.translations)) {
      if (!v) continue;
      const arr = seen.get(v) ?? [];
      arr.push(term.id);
      seen.set(v, arr);
    }
  }
  const dups = [...seen.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([surface, termIds]) => ({ surface, termIds }));

  const md =
    `# Terminology Consistency Report\n\n` +
    (dups.length === 0
      ? "✓ 无冲突：每个翻译表面唯一归属一个术语。\n"
      : dups.map(d => `- ⚠ "${d.surface}" 被以下术语共用：${d.termIds.join(", ")}`).join("\n"));

  return { duplicateSurfaces: dups, markdown: md };
}
