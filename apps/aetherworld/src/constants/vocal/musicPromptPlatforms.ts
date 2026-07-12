export type MusicPromptPlatform = "SUNO" | "UDIO" | "GOOGLE_AI_STUDIO" | "GENERIC";

export interface MusicPromptPlatformDef {
  id: MusicPromptPlatform;
  name: string;
  styleField: string;
  lyricField: string;
  notes: string[];
  supportsNegativePrompt: boolean;
}

export const MUSIC_PROMPT_PLATFORMS: MusicPromptPlatformDef[] = [
  {
    id: "SUNO", name: "Suno",
    styleField: "Style of Music", lyricField: "Lyrics",
    notes: [
      "不要把标题写进歌词区，否则可能被唱出。",
      "曲风/情绪写到 Style 字段。",
      "段落标签使用 [Verse] [Chorus] [Bridge] [Outro]。",
    ],
    supportsNegativePrompt: false,
  },
  {
    id: "UDIO", name: "Udio",
    styleField: "Tags / Description", lyricField: "Lyrics",
    notes: [
      "Udio 用 tags 控制曲风与声线。",
      "可以追加 vocal performance 描述。",
    ],
    supportsNegativePrompt: false,
  },
  {
    id: "GOOGLE_AI_STUDIO", name: "Google AI Studio (MusicFX)",
    styleField: "Prompt", lyricField: "—",
    notes: [
      "MusicFX 类工具更接近器乐 + 风格，不建议直接喂歌词。",
    ],
    supportsNegativePrompt: false,
  },
  {
    id: "GENERIC", name: "Generic",
    styleField: "Prompt", lyricField: "Lyrics",
    notes: ["通用模板，可复制到其他平台。"],
    supportsNegativePrompt: true,
  },
];

export function getPlatform(id: MusicPromptPlatform): MusicPromptPlatformDef {
  return MUSIC_PROMPT_PLATFORMS.find(p => p.id === id) ?? MUSIC_PROMPT_PLATFORMS[0];
}
