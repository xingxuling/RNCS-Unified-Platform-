// Founder Permission Calculus — resolves per-module permissions for the current role.

import { FOUNDER_PROTECTED_MODULES, type ProtectedModule } from "@/constants/founderProtectedModules";
import { FOUNDER_ROLES, hasAtLeast, type FounderRole } from "@/constants/founderRoles";
import type { RiskLevel } from "@/constants/founderPermissionLevels";
import { currentFounderRole } from "./founderCalculus";

export interface FounderPermission {
  moduleId: string;
  canView: boolean;
  canEdit: boolean;
  canRun: boolean;
  canExport: boolean;
  requiresConfirm: boolean;
  riskLevel: RiskLevel;
}

function permissionFor(role: FounderRole, m: ProtectedModule): FounderPermission {
  const meets = hasAtLeast(role, m.minRole);
  const isOwner = role === "OWNER";
  const isArchitect = hasAtLeast(role, "ARCHITECT");
  const isOperator = hasAtLeast(role, "OPERATOR");
  const hideFromStandard = m.hiddenFromNormalUser && role === "NONE";

  return {
    moduleId: m.id,
    canView: !hideFromStandard && (meets || !m.hiddenFromNormalUser),
    canEdit: meets && isArchitect,
    canRun: meets && isOperator,
    canExport: meets && isOperator,
    requiresConfirm: m.riskLevel === "HIGH" || m.riskLevel === "CRITICAL",
    riskLevel: m.riskLevel,
  };
}

export function getAllPermissions(role: FounderRole = currentFounderRole()): FounderPermission[] {
  return FOUNDER_PROTECTED_MODULES.map((m) => permissionFor(role, m));
}

export function getModulePermission(moduleId: string, role: FounderRole = currentFounderRole()): FounderPermission | null {
  const m = FOUNDER_PROTECTED_MODULES.find((x) => x.id === moduleId);
  if (!m) return null;
  return permissionFor(role, m);
}

export function isModuleVisible(moduleId: string, role: FounderRole = currentFounderRole()): boolean {
  return getModulePermission(moduleId, role)?.canView ?? false;
}

export function roleSummary(role: FounderRole = currentFounderRole()) {
  const perms = getAllPermissions(role);
  return {
    role,
    roleSpec: FOUNDER_ROLES[role],
    visible: perms.filter((p) => p.canView).length,
    editable: perms.filter((p) => p.canEdit).length,
    runnable: perms.filter((p) => p.canRun).length,
    total: perms.length,
  };
}
