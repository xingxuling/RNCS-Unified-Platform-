// 与数列货币引擎的世界资源保持一致
export const SIM_WORLD_RESOURCES = [
  { id: "WIND_CRYSTAL",    label: "风之结晶", digitTrigger: "5" },
  { id: "ARCHIVE_SHARD",   label: "归档碎片", digitTrigger: "0" },
  { id: "STAR_DUST",       label: "星辰之尘", digitTrigger: "9" },
  { id: "RULE_STONE",      label: "规则之石", digitTrigger: "4" },
  { id: "LIFE_SEED",       label: "生命之种", digitTrigger: "6" },
  { id: "VOID_TOKEN",      label: "虚无令牌", digitTrigger: "0" },
  { id: "RELATION_THREAD", label: "关系丝线", digitTrigger: "2" },
  { id: "EXPRESSION_INK",  label: "表达之墨", digitTrigger: "3" },
] as const;

export type SimWorldResourceId = typeof SIM_WORLD_RESOURCES[number]["id"];
