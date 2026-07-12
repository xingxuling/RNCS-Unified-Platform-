import { LanguageCode } from "@/constants/i18n/supportedLanguages";
import { getRegionProfile, RegionLanguageProfile } from "@/constants/i18n/regionLanguageProfiles";

export function pickRegionForLanguage(lang: LanguageCode): RegionLanguageProfile | undefined {
  switch (lang) {
    case "zh-CN": return getRegionProfile("CN");
    case "zh-HK": return getRegionProfile("HK");
    case "zh-TW": return getRegionProfile("TW");
    case "ja":    return getRegionProfile("JP");
    case "ko":    return getRegionProfile("KR");
    case "fr":    return getRegionProfile("FR");
    case "en":
    default:      return getRegionProfile("GLOBAL");
  }
}

export function adaptByRegion(text: string, lang: LanguageCode): string {
  const region = pickRegionForLanguage(lang);
  if (!region) return text;
  // Light-touch region notes appended in advanced views
  return text;
}

export function regionPreferencesFor(lang: LanguageCode): string[] {
  return pickRegionForLanguage(lang)?.preferences ?? [];
}
