export type DataFreshnessLevel = "FRESH" | "RECENT" | "AGING" | "STALE" | "UNKNOWN";

export const DATA_FRESHNESS_LEVELS: { id: DataFreshnessLevel; label: string; description: string }[] = [
  { id: "FRESH",   label: "新鲜",   description: "数据时效在窗口内。" },
  { id: "RECENT",  label: "较新",   description: "略旧但仍可参考。" },
  { id: "AGING",   label: "老化中", description: "接近过期，建议刷新。" },
  { id: "STALE",   label: "过期",   description: "数据过期，不应作为 current。" },
  { id: "UNKNOWN", label: "未知",   description: "无时间信息，需补充。" },
];
