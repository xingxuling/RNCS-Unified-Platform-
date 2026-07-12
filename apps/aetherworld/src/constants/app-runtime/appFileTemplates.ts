import type { AppFrameworkTarget } from "./appFrameworkTargets";

export interface AppFileTemplateEntry {
  path: string;
  fileType: "HTML" | "CSS" | "JS" | "TSX" | "JSON" | "MD" | "CONFIG";
  purpose: string;
  required: boolean;
}

export const APP_FILE_TEMPLATES: Record<AppFrameworkTarget | "HANDOFF_ONLY", AppFileTemplateEntry[]> = {
  SINGLE_HTML: [
    { path: "index.html", fileType: "HTML", purpose: "应用入口与全部内容", required: true },
  ],
  REACT_COMPONENT: [
    { path: "src/App.tsx",   fileType: "TSX",  purpose: "主组件", required: true },
    { path: "src/main.tsx",  fileType: "TSX",  purpose: "渲染入口", required: true },
    { path: "src/index.css", fileType: "CSS",  purpose: "全局样式", required: true },
    { path: "package.json",  fileType: "JSON", purpose: "依赖说明", required: true },
    { path: "README.md",     fileType: "MD",   purpose: "项目说明", required: true },
  ],
  VITE_REACT: [
    { path: "package.json",   fileType: "JSON", purpose: "依赖说明", required: true },
    { path: "index.html",     fileType: "HTML", purpose: "Vite 入口", required: true },
    { path: "src/main.tsx",   fileType: "TSX",  purpose: "渲染入口", required: true },
    { path: "src/App.tsx",    fileType: "TSX",  purpose: "主组件", required: true },
    { path: "src/styles.css", fileType: "CSS",  purpose: "全局样式", required: true },
    { path: "README.md",      fileType: "MD",   purpose: "项目说明", required: true },
  ],
  NEXTJS_DRAFT: [
    { path: "app/page.tsx",  fileType: "TSX",  purpose: "首页", required: true },
    { path: "package.json",  fileType: "JSON", purpose: "依赖说明", required: true },
    { path: "README.md",     fileType: "MD",   purpose: "项目说明", required: true },
  ],
  HANDOFF_ONLY: [
    { path: "PRODUCT_REQUIREMENTS.md", fileType: "MD", purpose: "产品需求", required: true },
    { path: "ARCHITECTURE.md",         fileType: "MD", purpose: "架构说明", required: true },
    { path: "CODEX_TASK.md",           fileType: "MD", purpose: "Codex 任务", required: true },
    { path: "QA_CHECKLIST.md",         fileType: "MD", purpose: "QA 清单", required: true },
  ],
};
