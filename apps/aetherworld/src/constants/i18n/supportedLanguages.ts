export type LanguageCode = "zh-CN" | "zh-HK" | "zh-TW" | "en" | "ja" | "ko" | "fr";

export interface SupportedLanguage {
  code: LanguageCode;
  name: string;
  nativeName: string;
  defaultRegion: string;
  readingDirection: "ltr";
  fallbackLanguage: LanguageCode;
  toneProfile: string;
  supportedModules: string[];
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: "zh-CN", name: "Simplified Chinese", nativeName: "简体中文",
    defaultRegion: "CN", readingDirection: "ltr", fallbackLanguage: "en",
    toneProfile: "清晰、直接、少术语、重实用",
    supportedModules: ["ALL"],
  },
  {
    code: "zh-HK", name: "Traditional Chinese (HK)", nativeName: "繁體中文（香港）",
    defaultRegion: "HK", readingDirection: "ltr", fallbackLanguage: "zh-CN",
    toneProfile: "繁中、可保留英文产品词、商业、实用、国际化",
    supportedModules: ["ALL"],
  },
  {
    code: "zh-TW", name: "Traditional Chinese (TW)", nativeName: "繁體中文（台灣）",
    defaultRegion: "TW", readingDirection: "ltr", fallbackLanguage: "zh-HK",
    toneProfile: "自然繁中、温和、避免大陆用语",
    supportedModules: ["ALL"],
  },
  {
    code: "en", name: "English", nativeName: "English",
    defaultRegion: "GLOBAL", readingDirection: "ltr", fallbackLanguage: "en",
    toneProfile: "professional, clear, product-oriented, less mystical",
    supportedModules: ["ALL"],
  },
  {
    code: "ja", name: "Japanese", nativeName: "日本語",
    defaultRegion: "JP", readingDirection: "ltr", fallbackLanguage: "en",
    toneProfile: "礼貌、清晰、柔和，避免绝对断言",
    supportedModules: ["ALL"],
  },
  {
    code: "ko", name: "Korean", nativeName: "한국어",
    defaultRegion: "KR", readingDirection: "ltr", fallbackLanguage: "en",
    toneProfile: "简洁、产品感强、行动明确",
    supportedModules: ["ALL"],
  },
  {
    code: "fr", name: "French", nativeName: "Français",
    defaultRegion: "FR", readingDirection: "ltr", fallbackLanguage: "en",
    toneProfile: "理性、清晰、概念解释充分，避免营销腔",
    supportedModules: ["ALL"],
  },
];

export function getLanguage(code: LanguageCode): SupportedLanguage {
  return SUPPORTED_LANGUAGES.find(l => l.code === code) ?? SUPPORTED_LANGUAGES[0];
}
