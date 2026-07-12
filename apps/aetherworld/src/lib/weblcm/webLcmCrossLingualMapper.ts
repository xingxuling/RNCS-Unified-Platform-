import type { AetherConcept } from "./webLcmTypes";

export type SupportedLanguage = "zh-CN" | "zh-TW" | "en" | "ja" | "ko" | "fr";

const TERM_MAP: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  "意图": { en: "Intent", ja: "意図", ko: "의도", fr: "Intention", "zh-TW": "意圖" },
  "世界": { en: "World", ja: "世界", ko: "세계", fr: "Monde", "zh-TW": "世界" },
  "角色": { en: "Character", ja: "キャラクター", ko: "캐릭터", fr: "Personnage", "zh-TW": "角色" },
  "应用": { en: "Application", ja: "アプリ", ko: "앱", fr: "Application", "zh-TW": "應用" },
  "错误": { en: "Error", ja: "エラー", ko: "오류", fr: "Erreur", "zh-TW": "錯誤" },
  "补丁": { en: "Patch", ja: "パッチ", ko: "패치", fr: "Correctif", "zh-TW": "補丁" },
  "概念": { en: "Concept", ja: "概念", ko: "개념", fr: "Concept", "zh-TW": "概念" },
};

export interface CrossLingualMapping {
  conceptId: string;
  baseTitle: string;
  translations: Partial<Record<SupportedLanguage, string>>;
}

export function mapConceptAcrossLanguages(concept: AetherConcept, langs: SupportedLanguage[]): CrossLingualMapping {
  const translations: Partial<Record<SupportedLanguage, string>> = {};
  for (const lang of langs) {
    let translated = concept.title;
    for (const [zh, map] of Object.entries(TERM_MAP)) {
      if (concept.title.includes(zh) && map[lang]) {
        translated = translated.replace(zh, map[lang]!);
      }
    }
    translations[lang] = translated;
  }
  return { conceptId: concept.conceptId, baseTitle: concept.title, translations };
}
