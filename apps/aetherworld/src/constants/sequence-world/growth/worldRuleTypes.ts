export const WORLD_RULE_TYPES = ["PHYSICS","MAGIC","SOCIAL","ECONOMIC","NARRATIVE","SAFETY","FOUNDER"] as const;
export type WorldRuleType = typeof WORLD_RULE_TYPES[number];
export const WORLD_RULE_ACTIONS = ["CREATE_RULE","UPGRADE_RULE","DEPRECATE_RULE","ARCHIVE_RULE","CONFLICT_RESOLVE_RULE","FOUNDER_LOCK_RULE"] as const;
export type WorldRuleAction = typeof WORLD_RULE_ACTIONS[number];
