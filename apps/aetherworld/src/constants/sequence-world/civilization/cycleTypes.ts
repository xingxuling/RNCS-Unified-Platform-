export const CYCLE_TYPES = [
  "RISE_AND_FALL","EXPANSION_AND_FRAGMENTATION","ORDER_AND_REBELLION",
  "MEMORY_AND_FORGETTING","RESOURCE_BOOM_AND_CRISIS","FAITH_AND_DOUBT",
  "WAR_AND_PEACE","COLLAPSE_AND_RESEED",
] as const;
export type CycleType = typeof CYCLE_TYPES[number];

export const CYCLE_STAGES = [
  "SEED","GROWTH","PEAK","TENSION","FRACTURE","DECLINE","ARCHIVE","RESEED",
] as const;
export type CycleStage = typeof CYCLE_STAGES[number];

export const CYCLE_LABELS: Record<CycleType, string> = {
  RISE_AND_FALL: "兴衰周期", EXPANSION_AND_FRAGMENTATION: "扩张与分裂",
  ORDER_AND_REBELLION: "秩序与反叛", MEMORY_AND_FORGETTING: "记忆与遗忘",
  RESOURCE_BOOM_AND_CRISIS: "资源繁荣与危机", FAITH_AND_DOUBT: "信仰与怀疑",
  WAR_AND_PEACE: "战争与和平", COLLAPSE_AND_RESEED: "崩塌与再种子",
};
