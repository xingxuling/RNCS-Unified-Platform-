// Aether Vocal Engine — orchestrator
import { buildVocalProfile, VocalProfile } from "./vocalProfileEngine";
import { estimateVocalRange, VocalRangeResult } from "./vocalRangeEstimator";
import { mapVocalStyle, VocalStyleResult } from "./vocalStyleMapper";
import { buildEmotionCurve, EmotionCurve } from "./emotionCurveEngine";
import { analyzeLyricSinging, LyricSingingAnalysis } from "./lyricSingingAnalyzer";
import { buildCharacterVoice, CharacterVoiceInput, CharacterVoiceResult } from "./characterVoiceEngine";
import { generateAIMusicPrompt, AIMusicPromptInput, AIMusicPromptResult } from "./aiMusicPromptEngine";
import { adaptForLanguage, MultilingualVocalAdaptation } from "./multilingualVocalAdapter";
import { buildPracticePlan, VocalPracticePlan } from "./vocalPracticePlanner";
import { checkVocalSafety, safetyNoteText, VocalSafetyResult } from "./vocalSafetyGuard";
import { VocalTypeId } from "@/constants/vocal/vocalTypes";
import { VocalRangeId } from "@/constants/vocal/vocalRanges";
import { EmotionCurveId } from "@/constants/vocal/emotionCurves";
import { MusicPromptPlatform } from "@/constants/vocal/musicPromptPlatforms";
import { SingingLanguage } from "@/constants/vocal/languageSingingProfiles";

export type VocalMode =
  | "CHARACTER_VOICE"
  | "LYRIC_ANALYSIS"
  | "AI_MUSIC_PROMPT"
  | "MULTILINGUAL_ADAPT"
  | "PRACTICE_PLAN";

export interface VocalEngineInput {
  mode: VocalMode;
  subjectName?: string;
  voiceType?: VocalTypeId;
  rangeId: VocalRangeId;
  rangeNote?: string;
  language: SingingLanguage;
  sourceLanguage?: SingingLanguage;
  genre: string;
  emotion: string;
  curveId: EmotionCurveId;
  platform: MusicPromptPlatform;
  songTitle?: string;
  lyrics?: string;
  character?: CharacterVoiceInput;
  sequenceBias?: Record<string, number>;
  goal?: string;
}

export interface VocalEngineResult {
  mode: VocalMode;
  vocalProfile: VocalProfile;
  range: VocalRangeResult;
  style: VocalStyleResult;
  emotionCurve: EmotionCurve;
  lyricAnalysis?: LyricSingingAnalysis[];
  characterVoice?: CharacterVoiceResult;
  aiPrompt?: AIMusicPromptResult;
  multilingual?: MultilingualVocalAdaptation;
  practice?: VocalPracticePlan;
  safety: VocalSafetyResult;
  safetyNote: string;
}

export function runVocalEngine(input: VocalEngineInput): VocalEngineResult {
  let character: CharacterVoiceResult | undefined;
  if (input.mode === "CHARACTER_VOICE" && input.character) {
    character = buildCharacterVoice(input.character);
  }

  const vocalProfile = character?.vocalProfile ?? buildVocalProfile({
    name: input.subjectName ?? "Subject",
    voiceType: input.voiceType,
    sequenceBias: input.sequenceBias,
  });

  const range = estimateVocalRange({ rangeId: input.rangeId, userNote: input.rangeNote });
  const style = mapVocalStyle({
    genre: input.genre,
    emotion: input.emotion,
    language: input.language,
    vocalProfile,
    targetPlatform: input.platform,
  });
  const emotionCurve = buildEmotionCurve(input.curveId);

  const lyricAnalysis = input.mode === "LYRIC_ANALYSIS" && input.lyrics
    ? analyzeLyricSinging(input.lyrics) : undefined;

  const aiPrompt = (input.mode === "AI_MUSIC_PROMPT" || input.mode === "CHARACTER_VOICE")
    ? generateAIMusicPrompt({
        platform: input.platform,
        songTitle: input.songTitle,
        language: input.language,
        genre: input.genre,
        vocalProfile,
        emotionCurve,
        lyrics: input.lyrics,
      })
    : undefined;

  const multilingual = input.mode === "MULTILINGUAL_ADAPT"
    ? adaptForLanguage(input.language, input.sourceLanguage)
    : undefined;

  const practice = input.mode === "PRACTICE_PLAN"
    ? buildPracticePlan(vocalProfile, input.goal ?? "稳定演唱副歌而不损嗓")
    : undefined;

  // safety scan: combine lyric + prompt text
  const scanText = [input.lyrics ?? "", aiPrompt?.copyReadyPrompt ?? ""].join("\n");
  const lyricContainsTitle = !!(input.songTitle && input.lyrics?.includes(input.songTitle));
  const safety = checkVocalSafety(scanText, {
    hasSafetyNote: true,
    isLyricRegion: !!input.lyrics,
    lyricContainsTitle,
  });

  return {
    mode: input.mode,
    vocalProfile,
    range,
    style,
    emotionCurve,
    lyricAnalysis,
    characterVoice: character,
    aiPrompt,
    multilingual,
    practice,
    safety,
    safetyNote: safetyNoteText(),
  };
}
