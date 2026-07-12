export const WEB_CAPABILITY_IDS = [
  "WEB_CODE_M",
  "WEB_PRODUCT_M",
  "WEB_DESIGN_M",
  "WEB_MUSIC_M",
  "WEB_STORY_M",
  "WEB_RESEARCH_M",
  "WEB_BIZ_M",
  "WEB_TEACH_M",
  "WEB_OPS_M",
  "WEB_STRATEGY_M",
  "WEB_GAME_M",
  "WEB_AGENT_M",
] as const;
export type WebCapabilityId = typeof WEB_CAPABILITY_IDS[number];

export const WEB_CAPABILITY_STATUSES = ["ACTIVE", "DRAFT", "REVIEW_NEEDED", "DISABLED"] as const;
export type WebCapabilityStatus = typeof WEB_CAPABILITY_STATUSES[number];
