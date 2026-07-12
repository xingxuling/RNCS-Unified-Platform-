export const WORLD_COMPRESSION_LEVELS = [
  { id: "SUMMARY", label: "世界摘要" },
  { id: "CANON_ONLY", label: "仅正典" },
  { id: "PLAYABLE_CORE", label: "可玩核心" },
  { id: "NARRATIVE_BIBLE", label: "剧情圣经" },
  { id: "GAME_RUNTIME_CORE", label: "游戏运行时核心" },
  { id: "FOUNDER_ARCHIVE", label: "Founder 归档" },
] as const;
export type WorldCompressionLevel = typeof WORLD_COMPRESSION_LEVELS[number]["id"];
