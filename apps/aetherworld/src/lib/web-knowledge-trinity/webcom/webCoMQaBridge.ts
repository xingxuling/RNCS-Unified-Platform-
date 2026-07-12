import type { WebKnowledgeQaReport, WebKnowledgeQaIssue, QaStatus, WebCoMConstraintBundle } from "../webKnowledgeTrinityTypes";
import type { ViolationRecord } from "./webCoMViolationDetector";

export function runWebCoMQa(bundle: WebCoMConstraintBundle, violations: ViolationRecord[]): WebKnowledgeQaReport {
  const issues: WebKnowledgeQaIssue[] = [];
  if (bundle.appliedConstantIds.length === 0) {
    issues.push({ ruleId: "NO_CONSTRAINTS_APPLIED", severity: "HIGH", message: "未应用任何常数约束。" });
  }
  violations.forEach((v) => {
    issues.push({ ruleId: "CONSTANT_VIOLATION", severity: v.severity, message: v.reason });
  });
  const status: QaStatus = issues.some((i) => i.severity === "CRITICAL") ? "BLOCKED"
    : issues.some((i) => i.severity === "HIGH") ? "FAIL"
    : issues.length ? "WARN" : "PASS";
  return { status, issues, recommendedFixes: issues.map((i) => i.message), checkedAt: new Date().toISOString() };
}
