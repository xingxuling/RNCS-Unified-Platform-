export const MISSING_LAYER_SEVERITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type MissingLayerSeverity = (typeof MISSING_LAYER_SEVERITY_LEVELS)[number];

export const SEVERITY_LABELS: Record<MissingLayerSeverity, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "极高",
};
