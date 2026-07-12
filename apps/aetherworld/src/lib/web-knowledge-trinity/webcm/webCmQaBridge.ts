import type { WebCmRoute, WebKnowledgeQaReport, WebKnowledgeQaIssue, QaStatus } from "../webKnowledgeTrinityTypes";
export function runWebCmQa(route: WebCmRoute): WebKnowledgeQaReport {
  const issues: WebKnowledgeQaIssue[] = [];
  if (route.selectedCalculusIds.length === 0) {
    issues.push({ ruleId: "NO_CALCULUS_SELECTED", severity: "HIGH", message: "未选中任何计算法。" });
  }
  if (route.qaRequired && !route.outputContract.includes("QA_REQUIRED")) {
    issues.push({ ruleId: "QA_NOT_DECLARED", severity: "MEDIUM", message: "qaRequired 但未在 outputContract 中声明。" });
  }
  const status: QaStatus = issues.some((i) => i.severity === "CRITICAL") ? "BLOCKED"
    : issues.some((i) => i.severity === "HIGH") ? "FAIL"
    : issues.length ? "WARN" : "PASS";
  return { status, issues, recommendedFixes: issues.map((i) => i.message), checkedAt: new Date().toISOString() };
}
