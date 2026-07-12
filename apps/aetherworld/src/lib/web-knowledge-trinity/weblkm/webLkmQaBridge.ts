import type { WebKnowledgeQaReport, WebKnowledgeQaIssue, QaStatus } from "../webKnowledgeTrinityTypes";
import type { RetrievedKnowledge } from "./webLkmKnowledgeRetriever";

export function runWebLkmQa(retrieved: RetrievedKnowledge[]): WebKnowledgeQaReport {
  const issues: WebKnowledgeQaIssue[] = [];
  if (retrieved.length === 0) {
    issues.push({ ruleId: "NO_KNOWLEDGE_RETRIEVED", severity: "MEDIUM", message: "未检索到相关知识。" });
  }
  retrieved.forEach((r) => {
    if (r.item.freshnessStatus === "STALE") {
      issues.push({ ruleId: "STALE_KNOWLEDGE", severity: "MEDIUM", message: `${r.item.title} 已标记为 STALE。` });
    }
    if (r.item.freshnessStatus === "CONFLICTED") {
      issues.push({ ruleId: "CONFLICTED_KNOWLEDGE", severity: "HIGH", message: `${r.item.title} 存在冲突。` });
    }
  });
  const status: QaStatus = issues.some((i) => i.severity === "CRITICAL") ? "BLOCKED"
    : issues.some((i) => i.severity === "HIGH") ? "FAIL"
    : issues.length ? "WARN" : "PASS";
  return {
    status, issues,
    recommendedFixes: issues.map((i) => `[${i.ruleId}] ${i.message}`),
    checkedAt: new Date().toISOString(),
  };
}
