export type AppFrameworkTarget = "SINGLE_HTML" | "REACT_COMPONENT" | "VITE_REACT" | "NEXTJS_DRAFT";

export const APP_FRAMEWORK_TARGETS: AppFrameworkTarget[] = [
  "SINGLE_HTML","REACT_COMPONENT","VITE_REACT","NEXTJS_DRAFT",
];

export const APP_FRAMEWORK_LABELS: Record<AppFrameworkTarget, string> = {
  SINGLE_HTML: "单文件 HTML",
  REACT_COMPONENT: "React 组件草案",
  VITE_REACT: "Vite + React",
  NEXTJS_DRAFT: "Next.js 草案",
};
