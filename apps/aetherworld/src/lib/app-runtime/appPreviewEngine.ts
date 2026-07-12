import type { AppProjectObject, AppPreviewConfig } from "./appProjectObjectEngine";

export function generateAppPreview(project: AppProjectObject): AppPreviewConfig {
  const htmlFile = project.codeFiles.find(f => f.path === "index.html");
  const isSingleHtml = project.architecture.frameworkTarget === "SINGLE_HTML";
  const previewMode: AppPreviewConfig["previewMode"] =
    htmlFile && isSingleHtml ? "IFRAME_HTML"
    : project.appRuntimeMode === "HANDOFF_ONLY" ? "EXTERNAL_HANDOFF"
    : "CODE_VIEW_ONLY";

  return {
    previewId: `preview-${project.projectId}`,
    projectId: project.projectId,
    previewMode,
    entryFile: htmlFile?.path || "src/App.tsx",
    previewHtml: previewMode === "IFRAME_HTML" ? htmlFile?.content : undefined,
    limitations: [
      "v0.1 不执行 npm install",
      "v0.1 不接真实外部 API",
      previewMode === "CODE_VIEW_ONLY" ? "React 草案在当前环境仅显示代码视图" : "",
      previewMode === "EXTERNAL_HANDOFF" ? "请使用 Codex / Cursor / Lovable 继续运行" : "",
    ].filter(Boolean),
  };
}
