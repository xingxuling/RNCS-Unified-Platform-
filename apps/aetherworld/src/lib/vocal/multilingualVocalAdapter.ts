import { LANGUAGE_SINGING_PROFILES, SingingLanguage, getLangProfile } from "@/constants/vocal/languageSingingProfiles";

export interface MultilingualVocalAdaptation {
  targetLanguage: SingingLanguage;
  singingDifficulty: number;
  syllableDensity: number;
  vowelFlow: string;
  rhythmFit: string;
  rewriteNeeded: boolean;
  adaptationNotes: string[];
}

export function adaptForLanguage(target: SingingLanguage, sourceLang?: SingingLanguage): MultilingualVocalAdaptation {
  const t = getLangProfile(target);
  const s = sourceLang ? getLangProfile(sourceLang) : undefined;
  const diff = Math.min(1, Math.abs((s?.syllableDensity ?? 0.7) - t.syllableDensity) * 2 + (target === "zh-HK" ? 0.3 : 0.1));
  const rewrite = !!s && (s.syllableDensity !== t.syllableDensity || target === "zh-HK");

  const notes: string[] = [
    `${t.name}：${t.vowelFlow}`,
    `节奏匹配：${t.rhythmFit}`,
    `推荐风格：${t.bestGenres.join(" / ")}`,
    ...t.caveats,
    "输出标记为「演唱适配版」而不是直译，必要时重写歌词。",
  ];
  if (target === "zh-HK") notes.push("粤语：旋律需重新走音以避免倒字。");

  return {
    targetLanguage: target,
    singingDifficulty: Math.round(diff * 100) / 100,
    syllableDensity: t.syllableDensity,
    vowelFlow: t.vowelFlow,
    rhythmFit: t.rhythmFit,
    rewriteNeeded: rewrite,
    adaptationNotes: notes,
  };
}

export const LANGUAGE_OPTIONS = LANGUAGE_SINGING_PROFILES.map(l => ({ code: l.code, name: l.name }));
