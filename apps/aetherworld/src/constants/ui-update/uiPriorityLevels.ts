// UI Update Engine — Priority Levels
export type UIPriority = "CORE" | "IMPORTANT" | "ADVANCED" | "FOUNDER" | "HIDDEN";

export const UI_PRIORITY_ORDER: Record<UIPriority, number> = {
  CORE: 1, IMPORTANT: 2, ADVANCED: 3, FOUNDER: 4, HIDDEN: 99,
};

export const UI_PRIORITY_LABELS: Record<UIPriority, string> = {
  CORE: "核心", IMPORTANT: "重要", ADVANCED: "高阶", FOUNDER: "创始人", HIDDEN: "隐藏",
};
