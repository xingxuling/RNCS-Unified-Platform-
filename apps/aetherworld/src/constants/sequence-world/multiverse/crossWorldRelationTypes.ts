export const CROSS_WORLD_RELATION_TYPES = [
  { id: "ALLIED_WORLD", label: "同盟世界" },
  { id: "MIRROR_WORLD", label: "镜像世界" },
  { id: "RIVAL_WORLD", label: "竞争世界" },
  { id: "TRADE_WORLD", label: "贸易世界" },
  { id: "ARCHIVE_PARENT", label: "归档父世界" },
  { id: "BRANCH_CHILD", label: "分支子世界" },
  { id: "DREAM_LINK", label: "梦境连接" },
  { id: "CANON_CONFLICT", label: "正典冲突" },
  { id: "RESOURCE_DEPENDENCY", label: "资源依赖" },
  { id: "FOUNDER_DOMAIN", label: "创始人领域" },
] as const;
export type CrossWorldRelationTypeId = (typeof CROSS_WORLD_RELATION_TYPES)[number]["id"];
