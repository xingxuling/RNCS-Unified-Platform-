import { LanguageCode } from "./supportedLanguages";

export interface RegionLanguageProfile {
  region: string;
  name: string;
  defaultLanguage: LanguageCode;
  preferences: string[];
  avoidStyles: string[];
}

export const REGION_PROFILES: RegionLanguageProfile[] = [
  {
    region: "CN", name: "Mainland China", defaultLanguage: "zh-CN",
    preferences: ["少英文", "强实用", "问题拆解", "行动建议", "回验"],
    avoidStyles: ["过度玄学", "命运断言"],
  },
  {
    region: "HK", name: "Hong Kong", defaultLanguage: "zh-HK",
    preferences: ["繁中", "可保留英文产品词", "商业效率", "隐私", "本地保存"],
    avoidStyles: ["大陆口语", "过度营销"],
  },
  {
    region: "TW", name: "Taiwan", defaultLanguage: "zh-TW",
    preferences: ["自然繁中", "心理 / 创作 / 自我探索", "温和"],
    avoidStyles: ["大陆用语", "命令感"],
  },
  {
    region: "JP", name: "Japan", defaultLanguage: "ja",
    preferences: ["柔和礼貌", "产品说明清晰", "世界观 / 虚拟生活"],
    avoidStyles: ["绝对断言", "强营销腔"],
  },
  {
    region: "KR", name: "Korea", defaultLanguage: "ko",
    preferences: ["简洁", "功能说明", "明确下一步"],
    avoidStyles: ["冗长哲学化"],
  },
  {
    region: "GLOBAL", name: "English Global", defaultLanguage: "en",
    preferences: ["professional", "AI product / decision system / workflow", "explainability", "validation"],
    avoidStyles: ["mystical phrasing", "over-hype"],
  },
  {
    region: "FR", name: "France / Francophone", defaultLanguage: "fr",
    preferences: ["clarté conceptuelle", "philosophique mais rationnel"],
    avoidStyles: ["marketing exagéré", "promesses absolues"],
  },
];

export function getRegionProfile(region: string): RegionLanguageProfile | undefined {
  return REGION_PROFILES.find(p => p.region === region);
}
