// UI Entry Scanner — checks registry for coverage gaps
import { UI_MODULE_REGISTRY, type UIModuleDefinition } from "./uiModuleRegistry";
import { EMPTY_STATE_TEMPLATES } from "@/constants/ui-update/emptyStateTemplates";

export interface UIEntryCoverage {
  totalModules: number;
  modulesWithRoutes: number;
  modulesInSidebar: number;
  modulesWithEmptyState: number;
  modulesWithUsageExample: number;
  modulesWithSafetyNote: number;
  modulesWithSubjectModeBadge: number;
  missingEmptyState: string[];
  missingUsageExample: string[];
  missingSafetyNote: string[];
  missingSubjectModeBadge: string[];
}

export function scanUiEntries(): UIEntryCoverage {
  const all = UI_MODULE_REGISTRY;
  const hasEmpty = new Set(EMPTY_STATE_TEMPLATES.map((e) => e.moduleId));

  const missingEmptyState: string[] = [];
  const missingUsageExample: string[] = [];
  const missingSafetyNote: string[] = [];
  const missingSubjectModeBadge: string[] = [];

  for (const m of all) {
    if (m.priority === "HIDDEN") continue;
    if (!m.hasEmptyState && !hasEmpty.has(m.moduleId) && (m.priority === "CORE" || m.priority === "IMPORTANT")) {
      missingEmptyState.push(m.moduleId);
    }
    if (!m.hasUsageExample && (m.priority === "CORE" || m.priority === "IMPORTANT")) {
      missingUsageExample.push(m.moduleId);
    }
    if (!m.hasSafetyNote && isHighRisk(m)) {
      missingSafetyNote.push(m.moduleId);
    }
    if (!m.hasSubjectModeBadge && m.priority === "CORE") {
      missingSubjectModeBadge.push(m.moduleId);
    }
  }

  return {
    totalModules: all.length,
    modulesWithRoutes: all.filter((m) => !!m.route).length,
    modulesInSidebar: all.filter((m) => m.sidebarVisible).length,
    modulesWithEmptyState: all.filter((m) => m.hasEmptyState || hasEmpty.has(m.moduleId)).length,
    modulesWithUsageExample: all.filter((m) => m.hasUsageExample).length,
    modulesWithSafetyNote: all.filter((m) => m.hasSafetyNote).length,
    modulesWithSubjectModeBadge: all.filter((m) => m.hasSubjectModeBadge).length,
    missingEmptyState, missingUsageExample, missingSafetyNote, missingSubjectModeBadge,
  };
}

function isHighRisk(m: UIModuleDefinition): boolean {
  return m.category === "WORLD_ENGINE" || m.category === "FOUNDER" ||
    m.moduleId === "sequence-currency" || m.moduleId === "system-constitution" ||
    m.moduleId === "real-subject-setup" || m.moduleId === "subject-mode";
}
