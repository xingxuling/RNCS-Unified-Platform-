import { buildVocalProfile, VocalProfile } from "./vocalProfileEngine";
import { VocalTypeId } from "@/constants/vocal/vocalTypes";

export interface CharacterVoiceInput {
  characterName: string;
  characterRole: string;
  worldName?: string;
  personalityKeywords: string[];
  storyPhase: string;
  targetLanguage: string;
  targetGenre: string;
}

export interface CharacterVoiceResult {
  characterName: string;
  voiceIdentity: string;
  vocalProfile: VocalProfile;
  singingStyle: string;
  emotionalSignature: string;
  recommendedGenres: string[];
  samplePrompt: string;
}

const PRESETS: Record<string, { type: VocalTypeId; identity: string; genres: string[]; emotion: string }> = {
  "蓝天机": {
    type: "COLD_DETACHED",
    identity: "冷感、克制、清醒，现实异质感；副歌进入高位裁决感。",
    genres: ["cinematic anime rock", "orchestral electronic"],
    emotion: "Cold → Judgment",
  },
  "云澜星禾": {
    type: "ETHEREAL_AETHER",
    identity: "柔亮空灵女声，星光感 synth，温柔但不软弱。",
    genres: ["emotional cinematic pop", "ethereal pop"],
    emotion: "Dream → Awakening",
  },
  "风云策": {
    type: "DARK_CINEMATIC",
    identity: "灰度、临界、战争感；低频鼓、紧张弦乐。",
    genres: ["cinematic", "war drama orchestral"],
    emotion: "Tension → Decision",
  },
  "万变": {
    type: "BROKEN_EMOTIONAL",
    identity: "异质、断裂、非唯一结局；变拍、电子/管弦混合。",
    genres: ["experimental electronic", "post-rock"],
    emotion: "Fragment → Mutation",
  },
};

export function buildCharacterVoice(input: CharacterVoiceInput): CharacterVoiceResult {
  const preset = PRESETS[input.characterName] ?? {
    type: "URBAN_REALISTIC" as VocalTypeId,
    identity: `${input.characterRole}：基于人格关键词推断的声线。`,
    genres: [input.targetGenre],
    emotion: "Adaptive",
  };

  const vp = buildVocalProfile({
    name: `${input.characterName} · 声线`,
    voiceType: preset.type,
  });

  const samplePrompt = [
    `Character: ${input.characterName} (${input.characterRole})`,
    `World: ${input.worldName ?? "—"}`,
    `Genre: ${preset.genres.join(" / ")}`,
    `Vocal: ${preset.identity}`,
    `Language: ${input.targetLanguage}`,
    `Phase: ${input.storyPhase}`,
    `Personality: ${input.personalityKeywords.join(", ")}`,
  ].join("\n");

  return {
    characterName: input.characterName,
    voiceIdentity: preset.identity,
    vocalProfile: vp,
    singingStyle: `${preset.genres[0]} · ${vp.voiceType}`,
    emotionalSignature: preset.emotion,
    recommendedGenres: preset.genres,
    samplePrompt,
  };
}

export const CHARACTER_PRESETS = Object.keys(PRESETS);
