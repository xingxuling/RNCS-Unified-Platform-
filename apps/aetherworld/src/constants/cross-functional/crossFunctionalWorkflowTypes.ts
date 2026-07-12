export const CROSS_FUNCTIONAL_WORKFLOW_TYPES = [
  "CHARACTER_ASSET_PACK",
  "WORLD_ASSET_PACK",
  "SONG_PRODUCTION_PACK",
  "PRODUCT_BUILD_PACK",
  "SEQUENCE_CREATION_PACK",
] as const;
export type CrossFunctionalWorkflowType = (typeof CROSS_FUNCTIONAL_WORKFLOW_TYPES)[number];

export const WORKFLOW_LABELS: Record<CrossFunctionalWorkflowType, string> = {
  CHARACTER_ASSET_PACK: "A · 角色内容资产包",
  WORLD_ASSET_PACK: "B · 世界观内容资产包",
  SONG_PRODUCTION_PACK: "C · 歌曲生产包",
  PRODUCT_BUILD_PACK: "D · 产品落地包",
  SEQUENCE_CREATION_PACK: "E · 数列创作包",
};
