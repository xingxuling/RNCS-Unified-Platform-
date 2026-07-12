export type SingingLanguage = "zh-CN" | "zh-HK" | "en" | "ja" | "ko" | "fr";

export interface SingingLanguageProfile {
  code: SingingLanguage;
  name: string;
  syllableDensity: number; // 0-1
  vowelFlow: string;
  rhythmFit: string;
  bestGenres: string[];
  caveats: string[];
}

export const LANGUAGE_SINGING_PROFILES: SingingLanguageProfile[] = [
  { code: "zh-CN", name: "简体中文", syllableDensity: 0.8, vowelFlow: "字音密集，元音变化大",
    rhythmFit: "适合情绪直接、叙事性强的旋律", bestGenres: ["抒情", "动漫 OP", "cinematic pop"],
    caveats: ["高音长音注意元音 ‘i / ü’ 的紧张", "避免吞字"] },
  { code: "zh-HK", name: "繁体中文（粤语）", syllableDensity: 0.85, vowelFlow: "声调复杂、九声六调",
    rhythmFit: "旋律必须配合声调，否则容易倒字", bestGenres: ["港式抒情", "电影主题曲"],
    caveats: ["改编旋律需重新走音", "押韵难度较高"] },
  { code: "en", name: "English", syllableDensity: 0.6, vowelFlow: "辅音收尾多，元音长短分明",
    rhythmFit: "适合摇滚 / 史诗 / 电影 / 流行", bestGenres: ["rock", "cinematic", "pop"],
    caveats: ["注意辅音不要被吞", "押韵考虑元音匹配"] },
  { code: "ja", name: "日本語", syllableDensity: 0.75, vowelFlow: "元音清晰、CV 结构",
    rhythmFit: "极适合动漫 OP / ED、cinematic anime", bestGenres: ["anime OP", "ballad", "city pop"],
    caveats: ["注意长音节拍", "避免汉字读音歧义"] },
  { code: "ko", name: "한국어", syllableDensity: 0.75, vowelFlow: "辅音收尾丰富，节奏感强",
    rhythmFit: "适合 K-pop / 情绪流行 / 电子", bestGenres: ["k-pop", "ballad", "electronic"],
    caveats: ["收尾辅音处理需要清晰但不生硬"] },
  { code: "fr", name: "Français", syllableDensity: 0.7, vowelFlow: "鼻化音、连读 liaison",
    rhythmFit: "适合优雅、诗性、电影感", bestGenres: ["chanson", "cinematic", "art pop"],
    caveats: ["不要把 liaison 唱断", "鼻化音保留共鸣"] },
];

export function getLangProfile(code: SingingLanguage): SingingLanguageProfile {
  return LANGUAGE_SINGING_PROFILES.find(l => l.code === code) ?? LANGUAGE_SINGING_PROFILES[0];
}
