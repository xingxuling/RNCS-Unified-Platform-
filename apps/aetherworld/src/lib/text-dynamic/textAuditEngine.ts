// Text Audit Engine — see spec §12
import { TEXT_REGISTRY, type TextEntry } from "./textRegistry";
import { TEXT_SAFETY_RULES } from "@/constants/text-dynamic/textSafetyRules";
import { localizationSummary } from "./textLocalizationSyncEngine";

export interface TextAuditIssue {
  textId: string;
  ruleId: string;
  severity: "INFO" | "WARN" | "HIGH" | "CRITICAL";
  message: string;
}

export interface TextAuditResult {
  status: "PASS" | "WARN" | "FAIL";
  issues: TextAuditIssue[];
  blockedTextIds: string[];
  recommendedFixes: string[];
  summary: {
    totalChecked: number;
    critical: number;
    high: number;
    warn: number;
  };
}

function auditEntry(entry: TextEntry): TextAuditIssue[] {
  const issues: TextAuditIssue[] = [];
  for (const rule of TEXT_SAFETY_RULES) {
    if (rule.forbiddenPatterns.length === 0) continue;
    for (const pat of rule.forbiddenPatterns) {
      if (pat.test(entry.currentText)) {
        issues.push({ textId: entry.textId, ruleId: rule.ruleId, severity: rule.severity, message: `命中禁止模式：${rule.description}` });
      }
    }
  }
  // Positive checks
  if (entry.subjectModeSensitivity === "FULL60_AWARE" && !/本地/.test(entry.currentText)) {
    issues.push({ textId: entry.textId, ruleId: "FULL60_REQUIRES_PRIVACY", severity: "HIGH", message: "Full60 文案缺少本地保存隐私提示" });
  }
  if (entry.moduleId === "sequence-currency" && !/不可兑换|不构成投资/.test(entry.currentText)) {
    issues.push({ textId: entry.textId, ruleId: "NO_CURRENCY_CASHOUT", severity: "CRITICAL", message: "数列货币文案必须包含非金融化边界" });
  }
  return issues;
}

export function runTextAudit(): TextAuditResult {
  const issues: TextAuditIssue[] = [];
  for (const entry of TEXT_REGISTRY) issues.push(...auditEntry(entry));

  // Localization drift
  const locs = localizationSummary();
  for (const [loc, s] of Object.entries(locs)) {
    if (s.stale > 0) {
      issues.push({
        textId: `__locale__/${loc}`,
        ruleId: "LOCALIZATION_DRIFT",
        severity: s.stale > 20 ? "HIGH" : "WARN",
        message: `${loc} 本地化滞后 ${s.stale} 条`,
      });
    }
  }

  const critical = issues.filter((i) => i.severity === "CRITICAL");
  const high = issues.filter((i) => i.severity === "HIGH");
  const warn = issues.filter((i) => i.severity === "WARN");
  const blockedTextIds = critical.map((i) => i.textId);

  const status: TextAuditResult["status"] = critical.length > 0 ? "FAIL" : (high.length + warn.length) > 0 ? "WARN" : "PASS";
  const fixes: string[] = [];
  if (critical.length > 0) fixes.push("立即修复 CRITICAL 文本并进入 Founder Review。");
  if (high.length > 0) fixes.push("HIGH 文本进入 Review 队列。");
  if (warn.length > 0) fixes.push("WARN 文本建议在下次发布前修复。");
  if (issues.length === 0) fixes.push("无问题。");

  return {
    status, issues, blockedTextIds, recommendedFixes: fixes,
    summary: { totalChecked: TEXT_REGISTRY.length, critical: critical.length, high: high.length, warn: warn.length },
  };
}
