// UI Audit Engine
import { detectStaleUi, type UIStaleItem } from "./uiStaleDetector";
import { generatePatchPrompts, type UIPatchPrompt } from "./uiPatchPromptGenerator";
import { scanUiEntries, type UIEntryCoverage } from "./uiEntryScanner";
import { checkUIPermissions, type UIPermissionIssue, type UIAudience, type UISubjectMode } from "./uiPermissionGuard";
import { UI_MODULE_REGISTRY } from "./uiModuleRegistry";

export interface UIAuditIssue {
  category: "ROUTE" | "QUICK_START" | "EMPTY_STATE" | "USAGE_EXAMPLE" | "SAFETY_NOTE" | "SUBJECT_BADGE" | "PERMISSION";
  moduleId: string;
  reason: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface UIAuditResult {
  status: "PASS" | "WARN" | "FAIL";
  coverage: UIEntryCoverage;
  issues: UIAuditIssue[];
  missingEntries: string[];
  staleEntries: UIStaleItem[];
  permissionIssues: UIPermissionIssue[];
  patchPrompts: UIPatchPrompt[];
}

export interface UIAuditOptions {
  knownRoutes?: Set<string>;
  audience?: UIAudience;
  subjectMode?: UISubjectMode;
  realSubjectConfigured?: boolean;
}

/** 默认包含所有注册模块的路由，假定路由都已存在；调用方可以传入实际路由集合做更严格检查 */
function defaultKnownRoutes(): Set<string> {
  return new Set(UI_MODULE_REGISTRY.map((m) => m.route));
}

export function runUIAudit(opts: UIAuditOptions = {}): UIAuditResult {
  const knownRoutes = opts.knownRoutes ?? defaultKnownRoutes();
  const coverage = scanUiEntries();
  const stale = detectStaleUi(knownRoutes);
  const permIssues = checkUIPermissions(
    opts.audience ?? "PUBLIC",
    opts.subjectMode ?? "DEMO",
    opts.realSubjectConfigured ?? false,
  );

  const issues: UIAuditIssue[] = [
    ...stale.staleItems.map<UIAuditIssue>((s) => ({
      category: s.itemType === "SIDEBAR" ? "ROUTE" : (s.itemType as UIAuditIssue["category"]),
      moduleId: s.moduleId, reason: s.reason, severity: s.severity,
    })),
    ...permIssues.map<UIAuditIssue>((p) => ({
      category: "PERMISSION", moduleId: p.moduleId, reason: p.description, severity: p.severity,
    })),
  ];

  const hasCritical = issues.some((i) => i.severity === "CRITICAL");
  const hasHigh = issues.some((i) => i.severity === "HIGH");
  const status: UIAuditResult["status"] = hasCritical ? "FAIL" : hasHigh ? "WARN" : issues.length > 0 ? "WARN" : "PASS";

  const missingEntries = Array.from(new Set(stale.staleItems.map((s) => s.moduleId)));
  const patchPrompts = generatePatchPrompts(stale.staleItems);

  return { status, coverage, issues, missingEntries, staleEntries: stale.staleItems, permissionIssues: permIssues, patchPrompts };
}
