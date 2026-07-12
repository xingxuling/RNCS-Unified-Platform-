export const CROSS_FUNCTIONAL_OUTPUT_TYPES = [
  "CHARACTER_ASSET_PACK",
  "WORLD_ASSET_PACK",
  "SONG_ASSET_PACK",
  "PRODUCT_BUILD_PACK",
  "PROMPT_PACK",
  "DOCS_PACK",
  "MULTILINGUAL_PACK",
  "ENGINE_USAGE_PACK",
  "WORKSPACE_OBJECT_PACK",
] as const;
export type CrossFunctionalOutputType = (typeof CROSS_FUNCTIONAL_OUTPUT_TYPES)[number];

export const OUTPUT_LABELS: Record<CrossFunctionalOutputType, string> = {
  CHARACTER_ASSET_PACK: "角色资产包",
  WORLD_ASSET_PACK: "世界资产包",
  SONG_ASSET_PACK: "歌曲资产包",
  PRODUCT_BUILD_PACK: "产品落地包",
  PROMPT_PACK: "Prompt 包",
  DOCS_PACK: "文档包",
  MULTILINGUAL_PACK: "多语言包",
  ENGINE_USAGE_PACK: "引擎用法包",
  WORKSPACE_OBJECT_PACK: "Workspace 对象包",
};
