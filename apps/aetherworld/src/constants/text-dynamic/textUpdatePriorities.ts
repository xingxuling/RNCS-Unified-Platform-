export const TEXT_UPDATE_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type TextUpdatePriority = (typeof TEXT_UPDATE_PRIORITIES)[number];

export const TEXT_PRIORITY_RANK: Record<TextUpdatePriority, number> = {
  LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4,
};
