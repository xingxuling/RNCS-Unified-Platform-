export type AppRuntimeMode =
  | "STATIC_PREVIEW" | "REACT_DRAFT" | "VITE_DRAFT" | "HANDOFF_ONLY"
  | "DESIGN_ONLY" | "CODE_DRAFT_ONLY";

export const APP_RUNTIME_MODES: AppRuntimeMode[] = [
  "STATIC_PREVIEW","REACT_DRAFT","VITE_DRAFT","HANDOFF_ONLY","DESIGN_ONLY","CODE_DRAFT_ONLY",
];

export const APP_RUNTIME_MODE_LABELS: Record<AppRuntimeMode, string> = {
  STATIC_PREVIEW: "单文件 HTML 预览",
  REACT_DRAFT: "React 组件草案",
  VITE_DRAFT: "Vite 项目草案",
  HANDOFF_ONLY: "仅外部工具交接包",
  DESIGN_ONLY: "仅设计与页面结构",
  CODE_DRAFT_ONLY: "仅代码草案不预览",
};

export const APP_RUNTIME_DEFAULT_MODES: AppRuntimeMode[] = [
  "STATIC_PREVIEW","REACT_DRAFT","HANDOFF_ONLY",
];
