export type EmotionCurveId =
  | "RESTRAINED_TO_EXPLOSIVE" | "BROKEN_TO_RESOLVED" | "COLD_TO_DIVINE"
  | "HUMAN_TO_MYTHIC" | "INTIMATE_TO_EPIC" | "LOST_TO_AWAKENED"
  | "GRIEF_TO_JUDGMENT" | "DREAM_TO_REALITY";

export interface EmotionCurveDef {
  id: EmotionCurveId;
  name: string;
  en: string;
  opening: string;
  verse: string;
  preChorus: string;
  chorus: string;
  bridge: string;
  final: string;
  intensity: { intro: number; verse: number; preChorus: number; chorus: number; bridge: number; finalChorus: number };
}

export const EMOTION_CURVES: EmotionCurveDef[] = [
  { id: "RESTRAINED_TO_EXPLOSIVE", name: "克制到爆发", en: "Restrained → Explosive",
    opening: "克制", verse: "压抑", preChorus: "积累", chorus: "爆发", bridge: "短暂坍缩", final: "终极释放",
    intensity: { intro: 0.2, verse: 0.35, preChorus: 0.6, chorus: 0.9, bridge: 0.55, finalChorus: 1.0 } },
  { id: "BROKEN_TO_RESOLVED", name: "破碎到释然", en: "Broken → Resolved",
    opening: "破碎", verse: "残留", preChorus: "释放前夕", chorus: "释然", bridge: "回望", final: "平静",
    intensity: { intro: 0.6, verse: 0.5, preChorus: 0.55, chorus: 0.7, bridge: 0.4, finalChorus: 0.6 } },
  { id: "COLD_TO_DIVINE", name: "冷感到神性", en: "Cold → Divine",
    opening: "冷感", verse: "疏离", preChorus: "上升", chorus: "神性", bridge: "仪式", final: "封印",
    intensity: { intro: 0.25, verse: 0.35, preChorus: 0.55, chorus: 0.85, bridge: 0.7, finalChorus: 0.95 } },
  { id: "HUMAN_TO_MYTHIC", name: "现实到神话", en: "Human → Mythic",
    opening: "人间", verse: "近距离", preChorus: "推开", chorus: "神话", bridge: "回到人间", final: "神话回响",
    intensity: { intro: 0.3, verse: 0.4, preChorus: 0.6, chorus: 0.85, bridge: 0.45, finalChorus: 0.9 } },
  { id: "INTIMATE_TO_EPIC", name: "亲密到史诗", en: "Intimate → Epic",
    opening: "亲密", verse: "低语", preChorus: "展开", chorus: "史诗", bridge: "回旋", final: "终章",
    intensity: { intro: 0.2, verse: 0.3, preChorus: 0.55, chorus: 0.9, bridge: 0.5, finalChorus: 0.95 } },
  { id: "LOST_TO_AWAKENED", name: "迷失到觉醒", en: "Lost → Awakened",
    opening: "迷失", verse: "徘徊", preChorus: "看见", chorus: "觉醒", bridge: "震动", final: "重生",
    intensity: { intro: 0.35, verse: 0.4, preChorus: 0.6, chorus: 0.85, bridge: 0.65, finalChorus: 0.9 } },
  { id: "GRIEF_TO_JUDGMENT", name: "悲伤到裁决", en: "Grief → Judgment",
    opening: "悲伤", verse: "下沉", preChorus: "凝聚", chorus: "裁决", bridge: "回看", final: "落锤",
    intensity: { intro: 0.4, verse: 0.45, preChorus: 0.6, chorus: 0.9, bridge: 0.55, finalChorus: 0.95 } },
  { id: "DREAM_TO_REALITY", name: "梦境到现实", en: "Dream → Reality",
    opening: "梦", verse: "漂浮", preChorus: "靠岸", chorus: "现实", bridge: "回梦", final: "落地",
    intensity: { intro: 0.25, verse: 0.3, preChorus: 0.55, chorus: 0.75, bridge: 0.45, finalChorus: 0.8 } },
];

export function getCurve(id: EmotionCurveId): EmotionCurveDef {
  return EMOTION_CURVES.find(c => c.id === id) ?? EMOTION_CURVES[0];
}
