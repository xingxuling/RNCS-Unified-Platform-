import { LanguageCode } from "./supportedLanguages";

export interface LanguageToneProfile {
  code: LanguageCode;
  voice: string;
  doList: string[];
  dontList: string[];
}

export const LANGUAGE_TONES: LanguageToneProfile[] = [
  { code: "zh-CN", voice: "清晰、直接", doList: ["短句", "实用", "行动建议"], dontList: ["玄学", "营销腔"] },
  { code: "zh-HK", voice: "商务繁中",   doList: ["可混英文产品词", "效率"],     dontList: ["大陆口语"] },
  { code: "zh-TW", voice: "温和繁中",   doList: ["心理/创作友好"],              dontList: ["命令感", "大陆用语"] },
  { code: "en",    voice: "professional", doList: ["product-oriented", "validation"], dontList: ["mystical", "hype"] },
  { code: "ja",    voice: "丁寧で柔らかい", doList: ["敬体", "明確な説明"],        dontList: ["断定", "誇張"] },
  { code: "ko",    voice: "간결한 제품 톤", doList: ["짧은 문장", "다음 행동"],     dontList: ["장황한 철학"] },
  { code: "fr",    voice: "rationnel et clair", doList: ["concept clair", "limites"], dontList: ["marketing exagéré"] },
];

export function toneFor(code: LanguageCode) {
  return LANGUAGE_TONES.find(t => t.code === code) ?? LANGUAGE_TONES[0];
}
