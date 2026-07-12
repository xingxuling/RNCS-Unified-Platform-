export type VocalTypeId =
  | "CLEAR_YOUTH" | "BREATHY_INTIMATE" | "DARK_CINEMATIC" | "ANIME_OPENING"
  | "ROCK_DRAMATIC" | "BALLAD_WARM" | "ETHEREAL_AETHER" | "HEROIC_EPIC"
  | "COLD_DETACHED" | "BROKEN_EMOTIONAL" | "DIVINE_RITUAL" | "URBAN_REALISTIC";

export interface VocalTypeDef {
  id: VocalTypeId;
  name: string;
  en: string;
  description: string;
  brightness: number;
  breathiness: number;
  tension: number;
  warmth: number;
  sharpness: number;
  dramaticIntensity: number;
}

export const VOCAL_TYPES: VocalTypeDef[] = [
  { id: "CLEAR_YOUTH", name: "清亮少年感", en: "Clear Youth", description: "明亮、干净、轻盈", brightness: 0.85, breathiness: 0.3, tension: 0.35, warmth: 0.5, sharpness: 0.55, dramaticIntensity: 0.4 },
  { id: "BREATHY_INTIMATE", name: "气声亲密感", en: "Breathy Intimate", description: "近耳、私密、温柔", brightness: 0.55, breathiness: 0.85, tension: 0.25, warmth: 0.75, sharpness: 0.3, dramaticIntensity: 0.45 },
  { id: "DARK_CINEMATIC", name: "低暗电影感", en: "Dark Cinematic", description: "低位、克制、电影质感", brightness: 0.3, breathiness: 0.5, tension: 0.55, warmth: 0.45, sharpness: 0.4, dramaticIntensity: 0.7 },
  { id: "ANIME_OPENING", name: "动漫 OP 感", en: "Anime Opening", description: "强推、副歌爆发、戏剧推进", brightness: 0.75, breathiness: 0.3, tension: 0.65, warmth: 0.55, sharpness: 0.7, dramaticIntensity: 0.85 },
  { id: "ROCK_DRAMATIC", name: "摇滚戏剧感", en: "Rock Dramatic", description: "胸声为主、张力大", brightness: 0.7, breathiness: 0.25, tension: 0.8, warmth: 0.5, sharpness: 0.75, dramaticIntensity: 0.85 },
  { id: "BALLAD_WARM", name: "抒情温暖感", en: "Ballad Warm", description: "温柔、有故事性", brightness: 0.55, breathiness: 0.55, tension: 0.35, warmth: 0.85, sharpness: 0.35, dramaticIntensity: 0.55 },
  { id: "ETHEREAL_AETHER", name: "空灵以太感", en: "Ethereal Aether", description: "空、远、神秘", brightness: 0.7, breathiness: 0.75, tension: 0.3, warmth: 0.55, sharpness: 0.45, dramaticIntensity: 0.6 },
  { id: "HEROIC_EPIC", name: "史诗英雄感", en: "Heroic Epic", description: "厚、宽、仪式感", brightness: 0.6, breathiness: 0.25, tension: 0.7, warmth: 0.65, sharpness: 0.65, dramaticIntensity: 0.9 },
  { id: "COLD_DETACHED", name: "冷感疏离", en: "Cold Detached", description: "冷、克制、保持距离", brightness: 0.5, breathiness: 0.45, tension: 0.4, warmth: 0.3, sharpness: 0.55, dramaticIntensity: 0.5 },
  { id: "BROKEN_EMOTIONAL", name: "破碎情绪感", en: "Broken Emotional", description: "颤、断、情绪外露", brightness: 0.45, breathiness: 0.7, tension: 0.6, warmth: 0.5, sharpness: 0.5, dramaticIntensity: 0.75 },
  { id: "DIVINE_RITUAL", name: "神性仪式感", en: "Divine Ritual", description: "高位、合唱、仪式", brightness: 0.7, breathiness: 0.4, tension: 0.55, warmth: 0.55, sharpness: 0.6, dramaticIntensity: 0.85 },
  { id: "URBAN_REALISTIC", name: "都市现实感", en: "Urban Realistic", description: "近、真、不修饰", brightness: 0.5, breathiness: 0.5, tension: 0.4, warmth: 0.5, sharpness: 0.4, dramaticIntensity: 0.5 },
];

export function getVocalType(id: VocalTypeId): VocalTypeDef {
  return VOCAL_TYPES.find(v => v.id === id) ?? VOCAL_TYPES[0];
}
