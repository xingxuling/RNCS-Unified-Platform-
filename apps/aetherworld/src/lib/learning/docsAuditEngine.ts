import { listTutorials, getTutorial } from "./tutorialRegistry";
import { listModuleDocs } from "./moduleDocGenerator";
import { checkTutorialSafety } from "./docsSafetyGuard";
import { getStaleReasons, getCurrentDocsVersion } from "./docsVersioningEngine";

export type AuditSeverity = "INFO" | "WARN" | "HIGH" | "CRITICAL";

export interface DocsAuditIssue {
  id: string;
  severity: AuditSeverity;
  message: string;
  target?: string;
}

export interface DocsAuditResult {
  status: "PASS" | "WARN" | "FAIL";
  issues: DocsAuditIssue[];
  missingDocs: string[];
  staleDocs: string[];
  suggestedFixes: string[];
  summary: { totalTutorials: number; totalModuleDocs: number; coveredModules: number; missingTutorials: number };
}

export function runDocsAudit(): DocsAuditResult {
  const tutorials = listTutorials();
  const modules = listModuleDocs();
  const issues: DocsAuditIssue[] = [];
  const missingDocs: string[] = [];
  const staleDocs: string[] = [];

  const tutorialModules = new Set(tutorials.flatMap((t) => t.targetModules));
  for (const m of modules) {
    if (!tutorialModules.has(m.moduleId)) {
      issues.push({ id: `no_tutorial_${m.moduleId}`, severity: "HIGH", message: `核心模块「${m.chineseTitle}」缺少教程。`, target: m.moduleId });
      missingDocs.push(m.moduleId);
    }
  }

  for (const t of tutorials) {
    const safety = checkTutorialSafety(t);
    if (!safety.passed) {
      for (const v of safety.violations) {
        issues.push({ id: `safety_${t.tutorialId}_${v.ruleId}`, severity: v.severity as AuditSeverity, message: `教程「${t.chineseTitle}」违反安全规则：${v.message}`, target: t.tutorialId });
      }
    }
    for (const s of t.steps) {
      if (s.targetRoute && !s.targetRoute.startsWith("/")) {
        issues.push({ id: `bad_route_${t.tutorialId}_${s.stepId}`, severity: "WARN", message: `教程「${t.chineseTitle}」步骤路由无效：${s.targetRoute}`, target: t.tutorialId });
      }
    }
    if (t.level === "BEGINNER" && t.estimatedMinutes > 20) {
      issues.push({ id: `too_long_${t.tutorialId}`, severity: "WARN", message: `新手教程「${t.chineseTitle}」时长过长（${t.estimatedMinutes} min）。`, target: t.tutorialId });
    }
    if (t.safetyNotes.length === 0 && (t.targetModules.includes("sequence-currency") || t.targetModules.includes("world-engine"))) {
      issues.push({ id: `no_safety_${t.tutorialId}`, severity: "HIGH", message: `教程「${t.chineseTitle}」缺少安全边界提示。`, target: t.tutorialId });
    }
  }

  const stale = getStaleReasons();
  if (stale.length > 0) {
    staleDocs.push(...stale);
    issues.push({ id: "docs_stale", severity: "WARN", message: `文档 stale 原因：${stale.join("; ")}` });
  }

  const hasCritical = issues.some((i) => i.severity === "CRITICAL");
  const hasHigh = issues.some((i) => i.severity === "HIGH");
  const status: DocsAuditResult["status"] = hasCritical ? "FAIL" : hasHigh || issues.length > 0 ? "WARN" : "PASS";

  return {
    status,
    issues,
    missingDocs,
    staleDocs,
    suggestedFixes: missingDocs.map((m) => `为模块 ${m} 生成至少一个 STEP_BY_STEP 教程。`),
    summary: {
      totalTutorials: tutorials.length,
      totalModuleDocs: modules.length,
      coveredModules: modules.length - missingDocs.length,
      missingTutorials: missingDocs.length,
    },
  };
}

export function docsAuditMeta() {
  return {
    docsVersion: getCurrentDocsVersion().version,
    auditedAt: new Date().toISOString(),
  };
}
