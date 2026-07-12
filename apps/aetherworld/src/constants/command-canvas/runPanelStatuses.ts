export const RUN_PANEL_STATUSES = ["QUEUED", "RUNNING", "DONE", "WARN", "FAIL", "BLOCKED"] as const;
export type RunPanelStatus = (typeof RUN_PANEL_STATUSES)[number];
export const RUN_PANEL_STATUS_COLOR: Record<RunPanelStatus, string> = {
  QUEUED: "text-muted-foreground",
  RUNNING: "text-blue-400",
  DONE: "text-emerald-400",
  WARN: "text-amber-400",
  FAIL: "text-red-400",
  BLOCKED: "text-red-500",
};
export const RUN_TYPES = [
  "APP_RUNTIME_RUN", "CODE_SANDBOX_RUN", "WEBLLM_RUN", "WEBLCM_RUN", "WEBLKM_RUN",
  "WEBCM_ROUTE_RUN", "WEBCOM_CHECK_RUN", "WEBLWM_TICK_RUN", "WEB_CAPABILITY_RUN",
  "QA_RUN", "VERSION_RUN", "RECALCULATION_RUN",
] as const;
export type RunType = (typeof RUN_TYPES)[number];
