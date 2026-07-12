import type { CodeRunResult, CodeSandboxQaResult, CodeSandboxQaIssue } from "./codeRunRequestEngine";

export function runCodeSandboxQa(result: Pick<CodeRunResult,
  "runnerMode" | "status" | "logs" | "errorSummary" | "repairSuggestions" | "patchDrafts" | "safetyNotes" | "workspaceRecordId"
>): CodeSandboxQaResult {
  const issues: CodeSandboxQaIssue[] = [];
  const add = (sev: CodeSandboxQaIssue["severity"], ruleId: string, msg: string) => issues.push({ ruleId, severity: sev, message: msg });

  if (!result.runnerMode) add("FAIL", "QA-001", "未指定 runnerMode");
  if (!result.logs || result.logs.length === 0) add("WARN", "QA-002", "运行未生成日志");
  if (result.status === "FAIL" && result.repairSuggestions.length === 0) add("FAIL", "QA-003", "FAIL 状态未生成修复建议");
  if (result.repairSuggestions.length > 0 && result.patchDrafts.length === 0) add("WARN", "QA-004", "有修复建议但未生成 Patch Draft");
  if (result.patchDrafts.some((p) => p.requiresHumanReview === false && (p.patchType === "FILE_REWRITE" || p.patchType === "HANDOFF_PATCH"))) {
    add("FAIL", "QA-005", "高风险 Patch 未标记需人工审查");
  }
  if (result.status === "BLOCKED") add("CRITICAL", "QA-006", "运行已被安全策略阻断");
  if (!result.workspaceRecordId) add("INFO", "QA-007", "尚未保存到 Workspace");
  if (result.safetyNotes.length === 0) add("INFO", "QA-008", "未附加安全说明");

  const hasCritical = issues.some((i) => i.severity === "CRITICAL");
  const hasFail = issues.some((i) => i.severity === "FAIL");
  const hasWarn = issues.some((i) => i.severity === "WARN");
  const status: CodeSandboxQaResult["status"] = hasCritical ? "BLOCKED" : hasFail ? "FAIL" : hasWarn ? "WARN" : "PASS";

  return {
    status,
    issues,
    recommendedFixes: issues.filter((i) => i.severity !== "INFO").map((i) => i.message),
  };
}
