import type { AppProjectObject, AppExportPackage, AppCodeFile } from "./appProjectObjectEngine";
import type { AppExportTarget } from "@/constants/app-runtime/appExportTargets";

function pickFiles(project: AppProjectObject, predicate: (f: AppCodeFile) => boolean): AppCodeFile[] {
  return project.codeFiles.filter(predicate);
}

function buildMarkdownSpec(project: AppProjectObject): AppCodeFile {
  const md = [
    `# ${project.projectName}`,
    ``,
    `- App Type: ${project.appType}`,
    `- Runtime Mode: ${project.appRuntimeMode}`,
    `- Version: ${project.version}`,
    ``,
    `## Intent`, project.intentSummary,
    ``,
    `## MVP`,
    ...project.featureList.map(f => `- **${f.title}** (${f.priority}) — ${f.userValue}`),
    ``,
    `## File Tree`,
    ...project.fileTree.files.map(f => `- \`${f.path}\` — ${f.purpose}`),
  ].join("\n");
  return {
    fileId: `export-md-${project.projectId}`,
    path: `${project.projectName}.spec.md`,
    language: "markdown",
    content: md,
    purpose: "Markdown 规格说明",
    editable: false,
    generatedAt: new Date().toISOString(),
  };
}

export function generateAppExportPackage(project: AppProjectObject, target: AppExportTarget): AppExportPackage {
  let files: AppCodeFile[] = [];
  switch (target) {
    case "SINGLE_HTML_FILE":   files = pickFiles(project, f => f.path === "index.html"); break;
    case "REACT_DRAFT_FILES":  files = pickFiles(project, f => /^src\//.test(f.path) || f.path === "package.json" || f.path === "README.md"); break;
    case "VITE_PROJECT_DRAFT": files = pickFiles(project, f => /^(src\/|index\.html|package\.json|README\.md)/.test(f.path)); break;
    case "MARKDOWN_SPEC":      files = [buildMarkdownSpec(project)]; break;
    case "CODEX_HANDOFF_PACK": files = pickFiles(project, f => /CODEX_TASK\.md|PRODUCT_REQUIREMENTS\.md|ARCHITECTURE\.md/.test(f.path)); break;
    case "CURSOR_HANDOFF_PACK":files = pickFiles(project, f => /CODEX_TASK\.md|README\.md/.test(f.path)); break;
    case "LOVABLE_HANDOFF_PACK":files = pickFiles(project, f => /PRODUCT_REQUIREMENTS\.md|ARCHITECTURE\.md|README\.md/.test(f.path)); break;
    case "QA_REPORT":
      files = [{
        fileId: `export-qa-${project.projectId}`,
        path: "QA_REPORT.md",
        language: "markdown",
        content: `# QA Report · ${project.projectName}\n\nStatus: **${project.qaResult?.status || "N/A"}**\n\n${(project.qaResult?.issues || []).map(i => `- [${i.severity}] ${i.ruleId}: ${i.message}`).join("\n")}`,
        purpose: "QA 报告",
        editable: false,
        generatedAt: new Date().toISOString(),
      }];
      break;
    case "ZIP_DRAFT": files = project.codeFiles; break;
  }
  return {
    packageId: `pkg-${project.projectId}-${target}`,
    projectId: project.projectId,
    exportTarget: target,
    files,
    metadata: { generatedAt: new Date().toISOString(), fileCount: files.length },
    safetyNotes: target === "ZIP_DRAFT" ? ["ZIP export is draft-only in this environment."] : [],
  };
}

export function exportPackageAsTextBlob(pkg: AppExportPackage): string {
  return pkg.files.map(f => `===== ${f.path} =====\n${f.content}\n`).join("\n");
}
