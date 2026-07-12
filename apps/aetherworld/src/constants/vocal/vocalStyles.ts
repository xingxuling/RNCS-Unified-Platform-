export const VOCAL_STYLE_TAGS = [
  "chest voice", "mixed voice", "head voice", "breathy vocal", "whisper tone",
  "belting", "restrained vocal", "dramatic cry", "vocal fry", "soft falsetto",
  "layered harmonies", "octave doubles", "delayed ad-libs", "spoken-sung",
  "chant-like vocal", "cinematic vocal",
] as const;

export type VocalStyleTag = typeof VOCAL_STYLE_TAGS[number];

export const GENRE_PRESETS: Record<string, { main: VocalStyleTag; chorus: VocalStyleTag; verse: VocalStyleTag; adlib: VocalStyleTag }> = {
  ANIME_OP:       { main: "mixed voice", verse: "restrained vocal", chorus: "belting", adlib: "delayed ad-libs" },
  CINEMATIC_POP:  { main: "mixed voice", verse: "breathy vocal", chorus: "cinematic vocal", adlib: "layered harmonies" },
  ROCK:           { main: "chest voice", verse: "spoken-sung", chorus: "belting", adlib: "dramatic cry" },
  BALLAD:         { main: "mixed voice", verse: "breathy vocal", chorus: "head voice", adlib: "soft falsetto" },
  ELECTRONIC:     { main: "mixed voice", verse: "whisper tone", chorus: "layered harmonies", adlib: "octave doubles" },
  KPOP:           { main: "mixed voice", verse: "breathy vocal", chorus: "belting", adlib: "delayed ad-libs" },
  ORCHESTRAL:     { main: "cinematic vocal", verse: "restrained vocal", chorus: "chant-like vocal", adlib: "layered harmonies" },
  FOLK:           { main: "chest voice", verse: "spoken-sung", chorus: "restrained vocal", adlib: "soft falsetto" },
};
