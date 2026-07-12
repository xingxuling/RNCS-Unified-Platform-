import type { WebLlmRunResult } from "./webLlmChatEngine";

export interface WebLlmQaIssue {
  ruleId: string;
  severity: "INFO" | "WARN" | "FAIL" | "CRITICAL";
  message: string;
}

export interface WebLlmQaResult {
  status: "PASS" | "WARN" | "FAIL" | "BLOCKED";
  issues: WebLlmQaIssue[];
  recommendedFixes: string[];
}

export function runWebLlmQa(result: WebLlmRunResult, outputText?: string): WebLlmQaResult {
  const text = outputText ?? result.rawText;
  const issues: WebLlmQaIssue[] = [];

  if (/Full60原始|完整六十数列|founder-only原文/i.test(text)) {
    issues.push({ ruleId: "PRIVACY_LEAKAGE", severity: "CRITICAL", message: "疑似泄漏受限内容。" });
  }
  if (/真实执行|已部署|已上线/.test(text)) {
    issues.push({ ruleId: "FAKE_REAL_EXECUTION", severity: "FAIL", message: "声称模拟为真实执行。" });
  }
  if (/rm -rf|sudo|curl .*\| sh/.test(text)) {
    issues.push({ ruleId: "UNSAFE_CODE", severity: "CRITICAL", message: "包含潜在危险命令。" });
  }
  if (!text.trim()) {
    issues.push({ ruleId: "EMPTY_OUTPUT", severity: "FAIL", message: "输出为空。" });
  }

  const status: WebLlmQaResult["status"] =
    issues.some((i) => i.severity === "CRITICAL") ? "BLOCKED" :
    issues.some((i) => i.severity === "FAIL") ? "FAIL" :
    issues.some((i) => i.severity === "WARN") ? "WARN" : "PASS";

  return {
    status,
    issues,
    recommendedFixes: issues.map((i) => `修复：${i.message}`),
  };
}
