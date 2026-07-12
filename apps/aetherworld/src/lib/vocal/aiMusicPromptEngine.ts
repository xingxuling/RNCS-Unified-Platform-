import { getPlatform, MusicPromptPlatform } from "@/constants/vocal/musicPromptPlatforms";
import type { VocalProfile } from "./vocalProfileEngine";
import type { EmotionCurve } from "./emotionCurveEngine";

export interface AIMusicPromptInput {
  platform: MusicPromptPlatform;
  songTitle?: string;
  language: string;
  genre: string;
  vocalProfile: VocalProfile;
  emotionCurve: EmotionCurve;
  lyrics?: string;
  avoidWords?: string[];
}

export interface AIMusicPromptResult {
  stylePrompt: string;
  vocalPrompt: string;
  arrangementPrompt: string;
  negativePrompt: string;
  sectionNotes: string[];
  copyReadyPrompt: string;
}

export function generateAIMusicPrompt(input: AIMusicPromptInput): AIMusicPromptResult {
  const platform = getPlatform(input.platform);
  const vp = input.vocalProfile;
  const ec = input.emotionCurve;

  const stylePrompt = [
    `${input.genre}`,
    `${input.language} vocal`,
    `${ec.openingEmotion} → ${ec.chorusEmotion} → ${ec.finalEmotion}`,
    "polished modern mix",
  ].join(", ");

  const vocalPrompt = [
    `${vp.voiceType.toLowerCase().replace(/_/g, " ")} lead vocal`,
    vp.breathiness > 0.6 ? "breathy verses" : "restrained verses",
    vp.dramaticIntensity > 0.8 ? "powerful mixed-voice chorus" : "controlled chorus",
    "layered harmonies",
    "natural dynamics",
  ].join(", ");

  const arrangementPrompt = [
    "intro: sparse / atmospheric",
    "verse: minimal, vocal-forward",
    "pre-chorus: rising tension",
    "chorus: full band + harmonies",
    "bridge: stripped",
    "outro: decay / cinematic",
  ].join("; ");

  const baseAvoid = ["overly theatrical", "shouty", "auto-tune artifacts"];
  if (input.avoidWords) baseAvoid.push(...input.avoidWords);
  const negativePrompt = baseAvoid.join(", ");

  const sectionNotes: string[] = [];
  if (input.platform === "SUNO") {
    sectionNotes.push("Suno：不要把标题写进 Lyrics 区，否则可能被唱出。");
    sectionNotes.push("Suno：Style of Music 字段写曲风+情绪+声线；Lyrics 区只放段落标签和正文。");
    if (input.songTitle) sectionNotes.push(`标题「${input.songTitle}」请填到 Song Name，不要放进 Lyrics。`);
  }
  if (input.platform === "UDIO") {
    sectionNotes.push("Udio：用 tags 控制声线，附加 ‘vocal performance’ 描述。");
  }
  if (!platform.supportsNegativePrompt && input.platform !== "GENERIC") {
    sectionNotes.push(`${platform.name} 暂不直接支持 negative prompt；负向词请融入风格描述。`);
  }

  const copyReadyPrompt = [
    `[${platform.styleField}]`, stylePrompt + ". " + vocalPrompt + ". " + arrangementPrompt + ".",
    "",
    `[${platform.lyricField}]`, sanitizeLyrics(input.lyrics, input.songTitle),
    "",
    `[Negative]`, negativePrompt,
  ].join("\n");

  return { stylePrompt, vocalPrompt, arrangementPrompt, negativePrompt, sectionNotes, copyReadyPrompt };
}

function sanitizeLyrics(lyrics?: string, title?: string): string {
  if (!lyrics) return "(填入歌词正文，使用 [Verse] [Chorus] 段落标签)";
  if (!title) return lyrics;
  // remove obvious "Title: xxx" lines from lyric region
  return lyrics
    .split(/\r?\n/)
    .filter(l => !/^title[:：]/i.test(l.trim()))
    .filter(l => l.trim() !== title.trim())
    .join("\n");
}
