// Constant Universe v0.2 — Validation Constants
export interface ValidationConstant {
  validationType: string;
  chineseName: string;
  measurableSignals: string[];
  defaultTimeWindow: string;
  recalculationTrigger: string;
}

export const VALIDATION_CONSTANTS: ValidationConstant[] = [
  {
    validationType: "PRODUCT_USE_VALIDATION", chineseName: "产品使用回验",
    measurableSignals: ["page views", "click rate", "retention", "user feedback", "completion rate"],
    defaultTimeWindow: "7d",
    recalculationTrigger: "weekly_or_on_release",
  },
  {
    validationType: "XIAOHONGSHU_VALIDATION", chineseName: "小红书回验",
    measurableSignals: ["views", "likes", "saves", "comments", "profile clicks", "follow conversion"],
    defaultTimeWindow: "72h",
    recalculationTrigger: "post_published_plus_72h",
  },
  {
    validationType: "WORLD_ENGINE_VALIDATION", chineseName: "世界引擎回验",
    measurableSignals: ["exported successfully", "no contradiction", "no overload", "narrative reusable", "runtime JSON valid"],
    defaultTimeWindow: "per_run",
    recalculationTrigger: "on_world_run_complete",
  },
  {
    validationType: "PREDICTION_VALIDATION", chineseName: "预测回验",
    measurableSignals: ["hit", "partial hit", "miss", "delayed hit", "condition changed"],
    defaultTimeWindow: "configurable",
    recalculationTrigger: "on_prediction_window_close",
  },
];
