export const INSPECTOR_TABS = [
  "OVERVIEW", "INPUTS", "OUTPUTS", "QA", "TRACE",
  "VERSION", "RECALCULATION", "CONSTANTS", "CONCEPTS", "EXPORT",
] as const;
export type InspectorTabId = (typeof INSPECTOR_TABS)[number];
export const INSPECTOR_TAB_LABELS: Record<InspectorTabId, string> = {
  OVERVIEW: "概览", INPUTS: "输入", OUTPUTS: "输出", QA: "审计", TRACE: "追踪",
  VERSION: "版本", RECALCULATION: "重算", CONSTANTS: "常数", CONCEPTS: "概念", EXPORT: "导出",
};
