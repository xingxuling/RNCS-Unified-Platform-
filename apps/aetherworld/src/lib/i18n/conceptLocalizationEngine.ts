import { LanguageCode } from "@/constants/i18n/supportedLanguages";
import { ConceptTranslationLevel } from "@/constants/i18n/conceptTranslationLevels";
import { findTerm, ProductTerm } from "@/constants/i18n/productTerminology";

export interface ConceptLocalizationResult {
  originalConcept: string;
  localizedName: string;
  plainExplanation: string;
  advancedExplanation: string;
  founderExplanation: string;
  avoidWording: string[];
  recommendedUIName: string;
  fallbackUsed: boolean;
}

const PLAIN_PREFIX: Record<LanguageCode, string> = {
  "zh-CN": "用一句话：", "zh-HK": "一句講：", "zh-TW": "一句話：",
  en: "In one line: ", ja: "一言で：", ko: "한 줄로: ", fr: "En une ligne : ",
};

export function localizeConcept(
  termId: string,
  lang: LanguageCode,
  level: ConceptTranslationLevel,
): ConceptLocalizationResult {
  const term: ProductTerm | undefined = findTerm(termId);
  if (!term) {
    return {
      originalConcept: termId,
      localizedName: termId,
      plainExplanation: "（未注册术语）",
      advancedExplanation: "（未注册术语）",
      founderExplanation: "（未注册术语）",
      avoidWording: [],
      recommendedUIName: termId,
      fallbackUsed: true,
    };
  }

  const localizedName = term.translations[lang] ?? term.translations.en;
  const fallbackUsed = !term.translations[lang];

  const recommendedUIName =
    level === "PLAIN_USER" ? simplifyForPlain(localizedName, lang)
    : level === "STRUCTURED_USER" ? localizedName
    : `${localizedName} (${term.translations.en})`;

  return {
    originalConcept: term.translations["zh-CN"],
    localizedName,
    plainExplanation: `${PLAIN_PREFIX[lang]}${term.plainMeaning}`,
    advancedExplanation: term.advancedMeaning,
    founderExplanation: term.founderMeaning,
    avoidWording: term.avoidTranslations,
    recommendedUIName,
    fallbackUsed,
  };
}

function simplifyForPlain(name: string, lang: LanguageCode): string {
  // Strip "Calculus" / "计算法" / "Engine" for plain-user surface
  const trims: Record<LanguageCode, RegExp[]> = {
    "zh-CN": [/计算法$/, /引擎$/],
    "zh-HK": [/計算法$/, /引擎$/],
    "zh-TW": [/計算法$/, /引擎$/],
    en: [/\s*Calculus$/i, /\s*Engine$/i],
    ja: [/計算$/, /エンジン$/],
    ko: [/계산법$/, /엔진$/],
    fr: [/\s*Calcul$/i, /\s*Moteur$/i],
  };
  let out = name;
  for (const re of trims[lang] ?? []) out = out.replace(re, "");
  return out.trim() || name;
}
