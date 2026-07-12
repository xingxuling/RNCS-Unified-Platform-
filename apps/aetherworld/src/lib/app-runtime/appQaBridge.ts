import { APP_QA_RULES } from "@/constants/app-runtime/appQaRules";
import type { AppProjectObject, AppQaResult, AppQaIssue } from "./appProjectObjectEngine";

export function runAppQa(project: AppProjectObject): AppQaResult {
  const issues: AppQaIssue[] = [];
  const push = (id: string, message: string) => {
    const rule = APP_QA_RULES.find(r => r.id === id);
    if (rule) issues.push({ ruleId: id, severity: rule.severity, message });
  };

  if (!project.projectName) push("QA-001", "缺少项目名");
  if (project.mvpScope.length === 0) push("QA-002", "未列出 MVP 范围");
  if (project.fileTree.files.length === 0) push("QA-003", "文件树为空");

  const hasEntry = project.codeFiles.some(f => /(index\.html|App\.tsx|main\.tsx|page\.tsx)/.test(f.path));
  if (!hasEntry) push("QA-004", "缺少入口文件");
  if (!project.codeFiles.some(f => f.path.toLowerCase().endsWith("readme.md"))) push("QA-005", "缺少 README");

  const html = project.codeFiles.find(f => f.path === "index.html");
  if (html && !/<\/html>/.test(html.content)) push("QA-006", "HTML 未正确闭合");

  const reactApp = project.codeFiles.find(f => f.path.endsWith("App.tsx"));
  if (reactApp && /useState/.test(reactApp.content) && !/from\s+["']react["']/.test(reactApp.content))
    push("QA-007", "React 文件缺少 import");

  const dangerous = project.codeFiles.some(f => /\beval\s*\(|new Function\s*\(|document\.write/.test(f.content));
  if (dangerous) push("QA-009", "检测到危险脚本");

  const sensitive = project.codeFiles.some(f => /(password|api[_-]?key|access[_-]?token|secret)\s*[:=]/i.test(f.content));
  if (sensitive) push("QA-010", "可能收集敏感信息");

  if (project.featureList.length > 8) push("QA-011", "功能过多，可能过度复杂");
  if (project.featureList.some(f => f.acceptanceCriteria.length === 0)) push("QA-012", "存在没有验收标准的功能");

  if (project.exportPackages.length === 0) push("QA-013", "尚未生成导出包");
  if (!project.workspaceRecordId) push("QA-014", "尚未保存到 Workspace");
  if (project.handoffPacks.length === 0) push("QA-015", "建议生成 Codex 任务包以继续开发");

  let status: AppQaResult["status"] = "PASS";
  if (issues.some(i => i.severity === "CRITICAL")) status = "BLOCKED";
  else if (issues.some(i => i.severity === "FAIL")) status = "FAIL";
  else if (issues.some(i => i.severity === "WARN")) status = "WARN";

  return {
    status,
    issues,
    recommendedFixes: issues.map(i => `[${i.ruleId}] ${i.message}`),
  };
}
