// UI Interface Update Engine — main facade
import { UI_MODULE_REGISTRY, type UIModuleDefinition } from "./uiModuleRegistry";
import { generateAllQuickStarts } from "./quickStartGenerator";
import { generateDashboardLayout, dashboardCoverage } from "./dashboardLayoutEngine";
import { generateSidebarPlan, auditSidebar } from "./sidebarGovernanceEngine";
import { listOnboardingFlows } from "./onboardingFlowEngine";
import { emptyStateCoverage } from "./emptyStateGenerator";
import { exampleCoverage } from "./examplePromptBinder";
import { runUIAudit, type UIAuditResult } from "./uiAuditEngine";
import { scanUiEntries } from "./uiEntryScanner";
import { CONSTITUTION_VERSION } from "@/lib/constitution/systemConstitutionEngine";

export interface UIUpdateSummary {
  totalModules: number;
  modulesWithRoutes: number;
  modulesInQuickStart: number;
  modulesWithExamples: number;
  modulesWithSafetyNotes: number;
  modulesWithEmptyState: number;
  modulesWithSubjectBadge: number;
  staleUiCount: number;
  criticalUiIssues: number;
  dashboardCoveragePercent: number;
  examplePercent: number;
  emptyStatePercent: number;
  constitutionVersion: string;
}

export function getUIUpdateSummary(audience: "PUBLIC" | "ADVANCED" | "FOUNDER" = "ADVANCED"): UIUpdateSummary {
  const cov = scanUiEntries();
  const qs = generateAllQuickStarts();
  const audit = runUIAudit({ audience });
  const dashboard = generateDashboardLayout(audience);
  const ex = exampleCoverage();
  const es = emptyStateCoverage();

  const inQuickStart = new Set<string>();
  for (const a of ["PUBLIC", "ADVANCED", "FOUNDER"] as const) {
    for (const it of qs[a].items) inQuickStart.add(it.targetModuleId);
  }

  return {
    totalModules: cov.totalModules,
    modulesWithRoutes: cov.modulesWithRoutes,
    modulesInQuickStart: inQuickStart.size,
    modulesWithExamples: ex.covered,
    modulesWithSafetyNotes: cov.modulesWithSafetyNote,
    modulesWithEmptyState: es.covered,
    modulesWithSubjectBadge: cov.modulesWithSubjectModeBadge,
    staleUiCount: audit.staleEntries.length,
    criticalUiIssues: audit.issues.filter((i) => i.severity === "CRITICAL").length,
    dashboardCoveragePercent: dashboardCoverage(dashboard),
    examplePercent: ex.percent,
    emptyStatePercent: es.percent,
    constitutionVersion: CONSTITUTION_VERSION,
  };
}

export interface UIUpdateBundle {
  summary: UIUpdateSummary;
  audit: UIAuditResult;
  modules: UIModuleDefinition[];
}

export function getUIUpdateBundle(audience: "PUBLIC" | "ADVANCED" | "FOUNDER" = "ADVANCED"): UIUpdateBundle {
  return {
    summary: getUIUpdateSummary(audience),
    audit: runUIAudit({ audience }),
    modules: UI_MODULE_REGISTRY,
  };
}

export {
  UI_MODULE_REGISTRY,
  generateAllQuickStarts,
  generateDashboardLayout,
  generateSidebarPlan,
  auditSidebar,
  listOnboardingFlows,
  runUIAudit,
};

export function uiUpdateMeta() {
  return {
    uiUpdateEngineVersion: "0.1.0",
    constitutionVersion: CONSTITUTION_VERSION,
  };
}

// Trigger Text Dynamic Update Engine after UI layout-affecting actions
import { detectTextImpact } from "@/lib/text-dynamic/textChangeDetector";
export function triggerTextDetectionAfterUIUpdate(
  trigger: "UI_LAYOUT_CHANGED" | "QUICK_START_CHANGED" | "ENGINE_ADDED" | "ROUTE_ADDED" = "UI_LAYOUT_CHANGED",
) {
  return detectTextImpact({ triggerType: trigger });
}
