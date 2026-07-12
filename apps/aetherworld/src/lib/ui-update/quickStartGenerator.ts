// Quick Start Generator
import {
  PUBLIC_QUICK_START, ADVANCED_QUICK_START, FOUNDER_QUICK_START,
  type QuickStartTemplate,
} from "@/constants/ui-update/quickStartTemplates";
import { UI_MODULE_REGISTRY } from "./uiModuleRegistry";

export type QuickStartAudience = "PUBLIC" | "ADVANCED" | "FOUNDER";

export interface QuickStartBundle {
  audience: QuickStartAudience;
  items: QuickStartTemplate[];
  coverage: number; // % of in-registry CORE/IMPORTANT modules covered for this audience
  missingModules: string[];
}

const TEMPLATES: Record<QuickStartAudience, QuickStartTemplate[]> = {
  PUBLIC: PUBLIC_QUICK_START,
  ADVANCED: ADVANCED_QUICK_START,
  FOUNDER: FOUNDER_QUICK_START,
};

export function generateQuickStart(audience: QuickStartAudience): QuickStartBundle {
  const items = [...TEMPLATES[audience]].sort((a, b) => a.priority - b.priority);
  const eligibleModules = UI_MODULE_REGISTRY.filter((m) => {
    if (!m.quickStartEligible) return false;
    if (m.priority !== "CORE" && m.priority !== "IMPORTANT" && m.priority !== "FOUNDER") return false;
    if (audience === "PUBLIC") return m.requiredUserMode === "PUBLIC";
    if (audience === "ADVANCED") return m.requiredUserMode !== "FOUNDER";
    return true;
  });
  const covered = new Set(items.map((i) => i.targetModuleId));
  const missingModules = eligibleModules.filter((m) => !covered.has(m.moduleId)).map((m) => m.moduleId);
  const coverage = eligibleModules.length === 0 ? 100 : Math.round(((eligibleModules.length - missingModules.length) / eligibleModules.length) * 100);
  return { audience, items, coverage, missingModules };
}

export function generateAllQuickStarts(): Record<QuickStartAudience, QuickStartBundle> {
  return {
    PUBLIC: generateQuickStart("PUBLIC"),
    ADVANCED: generateQuickStart("ADVANCED"),
    FOUNDER: generateQuickStart("FOUNDER"),
  };
}
