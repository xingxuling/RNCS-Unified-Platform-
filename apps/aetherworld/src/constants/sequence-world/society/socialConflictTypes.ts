export const SOCIAL_CONFLICT_TYPES = [
  "RESOURCE_CONFLICT","IDEOLOGY_CONFLICT","GOVERNANCE_CONFLICT","PERSONAL_CONFLICT",
  "FACTION_WAR","MEMORY_CONFLICT","RULE_CONFLICT","USER_INFLUENCE_CONFLICT",
] as const;
export type SocialConflictType = typeof SOCIAL_CONFLICT_TYPES[number];

export const SOCIAL_CONFLICT_LABELS: Record<SocialConflictType, string> = {
  RESOURCE_CONFLICT: "资源冲突",
  IDEOLOGY_CONFLICT: "信念冲突",
  GOVERNANCE_CONFLICT: "治理冲突",
  PERSONAL_CONFLICT: "个人冲突",
  FACTION_WAR: "阵营战争",
  MEMORY_CONFLICT: "历史记忆冲突",
  RULE_CONFLICT: "规则冲突",
  USER_INFLUENCE_CONFLICT: "用户影响冲突",
};

export const CONFLICT_RESOLUTIONS = [
  "negotiation","trade","duel","trial","ritual",
  "reform","exile","alliance","archive","timeline_split",
] as const;
export type ConflictResolution = typeof CONFLICT_RESOLUTIONS[number];
