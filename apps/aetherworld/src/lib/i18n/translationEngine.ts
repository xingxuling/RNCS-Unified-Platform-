import { LanguageCode } from "@/constants/i18n/supportedLanguages";
import { toneFor } from "@/constants/i18n/languageToneProfiles";
import { translateBySurface, listTerms } from "./terminologyDictionary";
import { checkTranslationSafety } from "./safetyTranslationGuard";
import { ConceptTranslationLevel } from "@/constants/i18n/conceptTranslationLevels";
import { getRegionProfile } from "@/constants/i18n/regionLanguageProfiles";

export interface TranslationInput {
  sourceText: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  userLevel: ConceptTranslationLevel;
  region?: string;
  moduleId?: string;
  preserveTerms?: string[];
  safetySensitive?: boolean;
}

export interface TranslationOutput {
  translatedText: string;
  targetLanguage: LanguageCode;
  userLevel: ConceptTranslationLevel;
  appliedTerms: string[];
  warnings: string[];
  safetyNotes: string[];
}

/**
 * Lightweight, deterministic translation: uses the terminology dictionary to
 * substitute known surface forms. For anything else, returns a marked fallback.
 * This is NOT a high-quality machine-translation API.
 */
export function translate(input: TranslationInput): TranslationOutput {
  const warnings: string[] = [];
  const appliedTerms: string[] = [];

  if (input.sourceLanguage === input.targetLanguage) {
    return {
      translatedText: input.sourceText,
      targetLanguage: input.targetLanguage,
      userLevel: input.userLevel,
      appliedTerms: [],
      warnings: [],
      safetyNotes: [],
    };
  }

  // Try direct terminology hit
  const hit = translateBySurface(input.sourceText, input.targetLanguage);
  if (hit.hit) {
    appliedTerms.push(hit.termId!);
    const safe = input.safetySensitive ? checkTranslationSafety(hit.text) : { violations: [], notes: [] };
    return {
      translatedText: hit.text,
      targetLanguage: input.targetLanguage,
      userLevel: input.userLevel,
      appliedTerms,
      warnings: safe.violations.map(v => `[${v.rule.severity}] ${v.rule.description}`),
      safetyNotes: safe.notes,
    };
  }

  // Sentence-level: substitute every known term inside the sentence
  let working = input.sourceText;
  for (const [substr, replaced, id] of scanSentenceTerms(working, input.sourceLanguage, input.targetLanguage)) {
    working = working.split(substr).join(replaced);
    appliedTerms.push(id);
  }

  const tone = toneFor(input.targetLanguage);
  const region = input.region ? getRegionProfile(input.region) : undefined;

  // No real MT here: mark fallback if no term substitutions matched the whole text
  if (working === input.sourceText) {
    warnings.push(
      "未接入真实机器翻译 API；当前仅基于术语表的辅助替换。建议提供完整译文或接入 AI Gateway。",
    );
    working = `[${input.targetLanguage} · ${tone.voice} fallback] ${input.sourceText}`;
  }

  if (region) {
    warnings.push(`地区适配：${region.name}（偏好：${region.preferences.slice(0, 2).join(" / ")}）`);
  }

  const safe = input.safetySensitive ? checkTranslationSafety(working) : { violations: [], notes: [] };

  return {
    translatedText: working,
    targetLanguage: input.targetLanguage,
    userLevel: input.userLevel,
    appliedTerms,
    warnings: [...warnings, ...safe.violations.map(v => `[${v.rule.severity}] ${v.rule.description}`)],
    safetyNotes: safe.notes,
  };
}

function scanSentenceTerms(
  text: string,
  _src: LanguageCode,
  target: LanguageCode,
): Array<[string, string, string]> {
  const out: Array<[string, string, string]> = [];
  for (const t of listTerms()) {
    for (const v of Object.values(t.translations)) {
      if (v && text.includes(v) && v !== t.translations[target]) {
        out.push([v, t.translations[target] ?? v, t.id]);
        break;
      }
    }
  }
  return out;
}
