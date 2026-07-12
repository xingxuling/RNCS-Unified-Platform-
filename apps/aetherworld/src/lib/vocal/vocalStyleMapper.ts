import { GENRE_PRESETS, VocalStyleTag } from "@/constants/vocal/vocalStyles";
import type { VocalProfile } from "./vocalProfileEngine";

export interface VocalStyleInput {
  genre: string;          // free string mapped to preset key when possible
  emotion: string;
  language: string;
  characterRole?: string;
  vocalProfile: VocalProfile;
  targetPlatform: string;
}

export interface VocalStyleResult {
  mainStyle: string;
  verseStyle: string;
  preChorusStyle: string;
  chorusStyle: string;
  bridgeStyle: string;
  adlibStyle: string;
  mixingAdvice: string[];
  aiPromptKeywords: string[];
}

function normalizeGenre(g: string): keyof typeof GENRE_PRESETS {
  const s = g.toLowerCase();
  if (/anime|op/.test(s)) return "ANIME_OP";
  if (/cinem/.test(s)) return "CINEMATIC_POP";
  if (/rock/.test(s)) return "ROCK";
  if (/ballad|抒情/.test(s)) return "BALLAD";
  if (/electronic|电子/.test(s)) return "ELECTRONIC";
  if (/k.?pop|韩/.test(s)) return "KPOP";
  if (/orch|管弦/.test(s)) return "ORCHESTRAL";
  if (/folk|民谣/.test(s)) return "FOLK";
  return "CINEMATIC_POP";
}

export function mapVocalStyle(input: VocalStyleInput): VocalStyleResult {
  const preset = GENRE_PRESETS[normalizeGenre(input.genre)];
  const { vocalProfile: vp } = input;

  const verseStyle: VocalStyleTag =
    vp.breathiness > 0.65 ? "breathy vocal" : preset.verse;
  const chorusStyle: VocalStyleTag =
    vp.dramaticIntensity > 0.8 ? "belting" : preset.chorus;

  const mixingAdvice: string[] = [
    "主唱用窄一些的混响，避免糊。",
    "副歌叠 octave double + 三度和声。",
    "verse 保留干声细节。",
  ];
  if (vp.breathiness > 0.6) mixingAdvice.push("气声段加 de-esser，控制齿音。");
  if (vp.dramaticIntensity > 0.8) mixingAdvice.push("副歌用并行压缩，保留爆发不削顶。");

  const keywords: string[] = [
    preset.main, verseStyle, chorusStyle, preset.adlib,
    `${input.emotion} emotion`, input.language,
  ];

  return {
    mainStyle: preset.main,
    verseStyle,
    preChorusStyle: "mixed voice rising",
    chorusStyle,
    bridgeStyle: "restrained vocal",
    adlibStyle: preset.adlib,
    mixingAdvice,
    aiPromptKeywords: keywords,
  };
}
