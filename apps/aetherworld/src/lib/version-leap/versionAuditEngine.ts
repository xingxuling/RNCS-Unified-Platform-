import type { VersionLeapScore } from "./versionLeapScorer";
import type { VersionClassification } from "./versionTypeClassifier";
import type { ReleaseReadinessResult } from "./releaseReadinessChecker";
import type { ReleaseNote } from "./releaseNoteGenerator";
import type { MigrationPlan } from "./versionMigrationPlanner";
import type { RollbackPlan } from "./versionRollbackPlanner";

export interface VersionAuditIssue {
  id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  label: string;
  hint: string;
}

export interface VersionAuditResult {
  status: "PASS" | "WARN" | "FAIL";
  issues: VersionAuditIssue[];
  recommendedActions: string[];
}

export interface VersionAuditInput {
  version?: string;
  releaseName?: string;
  score?: VersionLeapScore;
  classification?: VersionClassification;
  readiness?: ReleaseReadinessResult;
  releaseNote?: ReleaseNote;
  migrationPlan?: MigrationPlan;
  rollbackPlan?: RollbackPlan;
  founderApproved?: boolean;
  qaRan?: boolean;
  recalcRan?: boolean;
  knownIssuesAcknowledged?: boolean;
}

export function auditVersion(input: VersionAuditInput): VersionAuditResult {
  const issues: VersionAuditIssue[] = [];
  const push = (i: VersionAuditIssue) => issues.push(i);

  if (!input.version) push({ id: "no-version", severity: "MEDIUM", label: "缺少版本号", hint: "在 Version Leap 页生成建议版本号。" });
  if (!input.releaseName) push({ id: "no-release-name", severity: "LOW", label: "缺少 Release Name", hint: "为版本指定语义化名称。" });
  if (!input.score) push({ id: "no-score", severity: "MEDIUM", label: "缺少 Leap Score", hint: "运行 Version Leap Detector。" });
  if (!input.classification) push({ id: "no-classify", severity: "LOW", label: "缺少版本分类", hint: "运行 Version Type Classifier。" });
  if (!input.readiness) push({ id: "no-readiness", severity: "HIGH", label: "缺少 Release Readiness", hint: "运行发布就绪检查。" });
  if (!input.releaseNote) push({ id: "no-notes", severity: "MEDIUM", label: "缺少 Release Notes", hint: "生成更新日志。" });

  const lv = input.score?.leapLevel;
  if ((lv === "LEAP" || lv === "GENERATION") && !input.releaseNote) {
    push({ id: "leap-no-notes", severity: "HIGH", label: "LEAP 版本必须有 Release Note", hint: "生成 Founder + Public 版本日志。" });
  }
  if (lv === "GENERATION" && !input.migrationPlan) {
    push({ id: "gen-no-migration", severity: "CRITICAL", label: "GENERATION 版本必须有 Migration Plan", hint: "运行 Migration Planner。" });
  }
  if ((lv === "LEAP" || lv === "GENERATION") && !input.rollbackPlan) {
    push({ id: "leap-no-rollback", severity: "HIGH", label: "LEAP/GENERATION 版本建议提供 Rollback Plan", hint: "运行 Rollback Planner。" });
  }
  if (input.classification?.requiresFounderApproval && !input.founderApproved) {
    push({ id: "no-founder-approval", severity: "HIGH", label: "需要 Founder Approval", hint: "等待 Founder 审批。" });
  }
  if (!input.qaRan) push({ id: "no-qa", severity: "MEDIUM", label: "未运行 Software QA", hint: "前往 /software-qa。" });
  if (!input.recalcRan) push({ id: "no-recalc", severity: "LOW", label: "未运行 Recalculation", hint: "前往 /recalculation。" });

  if (input.readiness?.status === "BLOCKED" && input.classification && !input.classification.requiresMigration) {
    // BLOCKED with no migration plan but marked ready: extra critical check
  }
  if (input.readiness?.blockers.some((b) => b.severity === "CRITICAL") && input.readiness?.status === "READY") {
    push({ id: "critical-ready", severity: "CRITICAL", label: "存在 CRITICAL 阻断但被标记为 READY", hint: "回到 Release Readiness 修复。" });
  }
  if (!input.knownIssuesAcknowledged) {
    push({ id: "no-known-issues", severity: "LOW", label: "未确认 Known Issues", hint: "在 Release Notes 中标注已知问题。" });
  }

  const critical = issues.filter((i) => i.severity === "CRITICAL");
  const high = issues.filter((i) => i.severity === "HIGH");
  const status: "PASS" | "WARN" | "FAIL" =
    critical.length ? "FAIL" : (high.length || issues.length > 2 ? "WARN" : "PASS");

  return {
    status,
    issues,
    recommendedActions: issues.map((i) => `[${i.severity}] ${i.label} → ${i.hint}`),
  };
}
