export const WAR_PEACE_TYPES = [
  "BORDER_CONFLICT","RESOURCE_WAR","FAITH_WAR","CIVIL_WAR",
  "COLD_WAR","ALLIANCE_WAR","PEACE_TREATY","RECONCILIATION",
] as const;
export type WarPeaceType = typeof WAR_PEACE_TYPES[number];

export const WAR_PEACE_LABELS: Record<WarPeaceType, string> = {
  BORDER_CONFLICT: "边界冲突", RESOURCE_WAR: "资源战争", FAITH_WAR: "信仰战争",
  CIVIL_WAR: "内战", COLD_WAR: "冷战", ALLIANCE_WAR: "联盟战争",
  PEACE_TREATY: "和平条约", RECONCILIATION: "和解",
};

export const WAR_PEACE_FICTION_NOTE =
  "战争记录仅用于虚拟文明叙事和游戏设定。系统不会输出针对现实群体的暴力指导或仇恨内容。";
