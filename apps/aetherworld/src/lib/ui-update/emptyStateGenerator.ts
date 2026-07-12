// Empty State Generator
import { EMPTY_STATE_TEMPLATES, getEmptyState, type EmptyStateDefinition } from "@/constants/ui-update/emptyStateTemplates";
import { UI_MODULE_REGISTRY } from "./uiModuleRegistry";

export { getEmptyState, EMPTY_STATE_TEMPLATES };
export type { EmptyStateDefinition };

export function emptyStateCoverage() {
  const covered = new Set(EMPTY_STATE_TEMPLATES.map((e) => e.moduleId));
  const eligible = UI_MODULE_REGISTRY.filter((m) => m.priority === "CORE" || m.priority === "IMPORTANT");
  const missing = eligible.filter((m) => !covered.has(m.moduleId)).map((m) => m.moduleId);
  return {
    total: eligible.length,
    covered: eligible.length - missing.length,
    missing,
    percent: eligible.length === 0 ? 100 : Math.round(((eligible.length - missing.length) / eligible.length) * 100),
  };
}
