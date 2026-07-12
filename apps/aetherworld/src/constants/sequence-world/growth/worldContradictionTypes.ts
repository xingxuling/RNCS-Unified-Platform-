export const WORLD_CONTRADICTION_TYPES = [
  "LORE_CONFLICT","TIMELINE_CONFLICT","NPC_MEMORY_CONFLICT","RULE_CONFLICT",
  "RESOURCE_CONFLICT","CANON_CONFLICT","REALITY_CONFUSION","DUPLICATE_ASSET","OVERGROWTH",
] as const;
export type WorldContradictionType = typeof WORLD_CONTRADICTION_TYPES[number];

export const CONTRADICTION_SEVERITIES = ["LOW","MEDIUM","HIGH","CRITICAL"] as const;
export type ContradictionSeverity = typeof CONTRADICTION_SEVERITIES[number];

export const CONTRADICTION_FIX_STRATEGIES = ["merge","archive","splitTimeline","downgradeCanon","founderReview","compress"] as const;
export type ContradictionFixStrategy = typeof CONTRADICTION_FIX_STRATEGIES[number];
