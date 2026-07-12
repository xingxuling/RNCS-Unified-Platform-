export const MULTI_WORLD_EVENT_TYPES = [
  { id: "PORTAL_OPENING", label: "门户开启" },
  { id: "PORTAL_COLLAPSE", label: "门户崩塌" },
  { id: "CROSS_WORLD_TRADE", label: "跨世界交易" },
  { id: "CANON_COLLISION", label: "正典碰撞" },
  { id: "WORLD_MIGRATION", label: "世界迁移" },
  { id: "MULTI_WORLD_CONFLICT", label: "多世界冲突" },
  { id: "FEDERATION_FORMATION", label: "世界联邦形成" },
  { id: "ARCHIVE_WAVE", label: "归档浪潮" },
  { id: "RESEED_WAVE", label: "再种子浪潮" },
  { id: "FOUNDER_DECREE_EVENT", label: "创始人裁定事件" },
] as const;
export type MultiWorldEventTypeId = (typeof MULTI_WORLD_EVENT_TYPES)[number]["id"];
