export const WORLD_FEDERATION_TYPES = [
  { id: "CREATOR_FEDERATION", label: "创作者世界联邦" },
  { id: "GAME_WORLD_CLUSTER", label: "游戏世界群" },
  { id: "NARRATIVE_MULTIVERSE", label: "叙事多宇宙" },
  { id: "ARCHIVE_NETWORK", label: "档案网络" },
  { id: "DREAM_CHAIN", label: "梦境链" },
  { id: "FOUNDER_DOMAIN", label: "创始人领域" },
] as const;
export type WorldFederationTypeId = (typeof WORLD_FEDERATION_TYPES)[number]["id"];
