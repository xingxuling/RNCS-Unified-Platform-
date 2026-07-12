export const WORLD_CANON_ENTRY_TYPES = [
  "WORLD_RULE","ZONE","NPC","EVENT","RESOURCE","TIMELINE","LORE","FOUNDER_DECREE",
] as const;
export type WorldCanonEntryType = typeof WORLD_CANON_ENTRY_TYPES[number];

export const WORLD_CANON_LEVELS = ["DRAFT","SOFT_CANON","HARD_CANON","FOUNDER_LOCKED"] as const;
export type WorldCanonLevel = typeof WORLD_CANON_LEVELS[number];

export const CANON_LEVEL_LABEL: Record<WorldCanonLevel,string> = {
  DRAFT: "草稿", SOFT_CANON: "软正典", HARD_CANON: "硬正典", FOUNDER_LOCKED: "创始人锁定",
};
