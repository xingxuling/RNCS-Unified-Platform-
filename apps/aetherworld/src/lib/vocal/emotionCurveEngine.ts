import { EMOTION_CURVES, EmotionCurveId, getCurve } from "@/constants/vocal/emotionCurves";

export interface EmotionCurve {
  openingEmotion: string;
  verseEmotion: string;
  preChorusEmotion: string;
  chorusEmotion: string;
  bridgeEmotion: string;
  finalEmotion: string;
  intensityMap: { intro: number; verse: number; preChorus: number; chorus: number; bridge: number; finalChorus: number };
  vocalRisk: string;
}

export function buildEmotionCurve(id: EmotionCurveId): EmotionCurve {
  const c = getCurve(id);
  const peak = Math.max(c.intensity.chorus, c.intensity.finalChorus);
  const risk = peak >= 0.9
    ? "高强度副歌：注意热身、降调备份，不要硬顶。"
    : peak >= 0.75
    ? "中高强度：副歌注意混声切换。"
    : "低/中强度：以情绪与气息为主。";
  return {
    openingEmotion: c.opening,
    verseEmotion: c.verse,
    preChorusEmotion: c.preChorus,
    chorusEmotion: c.chorus,
    bridgeEmotion: c.bridge,
    finalEmotion: c.final,
    intensityMap: c.intensity,
    vocalRisk: risk,
  };
}

export const EMOTION_CURVE_OPTIONS = EMOTION_CURVES.map(c => ({ id: c.id, label: `${c.name} · ${c.en}` }));
