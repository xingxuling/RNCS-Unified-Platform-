export const CONFLICT_TYPES = [
  { id: "INTERNAL_CONFLICT",      name: "内在冲突" },
  { id: "RELATIONSHIP_CONFLICT",  name: "关系冲突" },
  { id: "SYSTEM_CONFLICT",        name: "制度冲突" },
  { id: "CIVILIZATION_CONFLICT",  name: "文明冲突" },
  { id: "IDENTITY_CONFLICT",      name: "身份冲突" },
  { id: "MORAL_CONFLICT",         name: "价值冲突" },
  { id: "REALITY_VS_MYTH",        name: "现实与神话" },
  { id: "FREEDOM_VS_ORDER",       name: "自由与秩序" },
  { id: "HUMAN_VS_ROLE",          name: "人性与职责" },
  { id: "DELAYED_CHOICE",         name: "迟疑与必须选择" },
] as const;
export type ConflictTypeId = typeof CONFLICT_TYPES[number]["id"];
