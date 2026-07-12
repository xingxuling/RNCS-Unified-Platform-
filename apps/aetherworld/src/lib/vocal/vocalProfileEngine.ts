import { VOCAL_TYPES, VocalTypeId, getVocalType } from "@/constants/vocal/vocalTypes";

export interface VocalProfile {
  id: string;
  name: string;
  voiceType: VocalTypeId;
  vocalWeight: "LIGHT" | "MEDIUM" | "HEAVY";
  brightness: number;
  breathiness: number;
  tension: number;
  warmth: number;
  sharpness: number;
  emotionalDensity: number;
  dramaticIntensity: number;
  recommendedRange: string;
  riskNotes: string[];
}

export interface VocalProfileInput {
  name: string;
  voiceType?: VocalTypeId;
  recommendedRange?: string;
  sequenceBias?: Record<string, number>; // 0-9 digit frequency
  emotionalDensity?: number;
}

export function buildVocalProfile(input: VocalProfileInput): VocalProfile {
  const baseType = input.voiceType ?? inferTypeFromSequence(input.sequenceBias);
  const t = getVocalType(baseType);
  const weight: VocalProfile["vocalWeight"] =
    t.tension > 0.65 ? "HEAVY" : t.tension < 0.4 ? "LIGHT" : "MEDIUM";

  const risks: string[] = [];
  if (t.tension > 0.75) risks.push("张力偏高：注意热身与降调备份。");
  if (t.dramaticIntensity > 0.85) risks.push("戏剧强度大：副歌避免连续高位强混。");
  if (t.breathiness > 0.8) risks.push("气声占比高：注意气息储备，避免长时间漏气。");

  return {
    id: `vp_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    voiceType: t.id,
    vocalWeight: weight,
    brightness: t.brightness,
    breathiness: t.breathiness,
    tension: t.tension,
    warmth: t.warmth,
    sharpness: t.sharpness,
    emotionalDensity: input.emotionalDensity ?? 0.6,
    dramaticIntensity: t.dramaticIntensity,
    recommendedRange: input.recommendedRange ?? "—",
    riskNotes: risks,
  };
}

function inferTypeFromSequence(bias?: Record<string, number>): VocalTypeId {
  if (!bias) return "URBAN_REALISTIC";
  const entries = Object.entries(bias).sort((a, b) => b[1] - a[1]);
  const top = entries[0]?.[0] ?? "5";
  const map: Record<string, VocalTypeId> = {
    "0": "ETHEREAL_AETHER", "1": "HEROIC_EPIC", "2": "BREATHY_INTIMATE",
    "3": "URBAN_REALISTIC", "4": "DARK_CINEMATIC", "5": "ANIME_OPENING",
    "6": "BALLAD_WARM", "7": "BROKEN_EMOTIONAL", "8": "ROCK_DRAMATIC", "9": "DIVINE_RITUAL",
  };
  return map[top] ?? "URBAN_REALISTIC";
}

export const VOCAL_TYPE_OPTIONS = VOCAL_TYPES.map(t => ({ id: t.id, label: `${t.name} · ${t.en}` }));
