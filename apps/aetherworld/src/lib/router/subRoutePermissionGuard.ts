/**
 * 权限守卫：判断子路由是否对当前用户可见 / 可访问
 */
import type { UserMode, SubjectMode } from "@/constants/router/routeGroups";
import type { SubRouteDefinition } from "@/constants/router/subRouteDefinitions";
import { allowedModesFor } from "@/constants/router/routeVisibilityRules";

export type PermissionStatus = "ALLOWED" | "LOCKED" | "HIDDEN";

export interface PermissionContext {
  userMode: UserMode;
  subjectMode?: SubjectMode;
  founderActive: boolean;
}

export function evaluateSubRoutePermission(
  route: SubRouteDefinition,
  ctx: PermissionContext,
): PermissionStatus {
  if (route.hidden) return "HIDDEN";

  // Founder-only：非 Founder 完全隐藏，避免暴露
  if (route.founderOnly && !ctx.founderActive) return "HIDDEN";

  const allowed = allowedModesFor(ctx.userMode);
  if (!allowed.includes(route.requiredUserMode)) {
    // 普通用户看到高阶模块：锁定但显示
    return route.requiredUserMode === "FOUNDER" ? "HIDDEN" : "LOCKED";
  }

  // SubjectMode 检查
  if (route.requiredSubjectMode && route.requiredSubjectMode !== "ANY" && ctx.subjectMode) {
    if (route.requiredSubjectMode === "FULL_60" && ctx.subjectMode !== "FULL_60" && ctx.subjectMode !== "FOUNDER") {
      return "LOCKED";
    }
    if (route.requiredSubjectMode === "FOUNDER" && ctx.subjectMode !== "FOUNDER") {
      return "LOCKED";
    }
  }

  return "ALLOWED";
}

export function filterVisibleRoutes(
  routes: SubRouteDefinition[],
  ctx: PermissionContext,
): { route: SubRouteDefinition; status: PermissionStatus }[] {
  return routes
    .map((r) => ({ route: r, status: evaluateSubRoutePermission(r, ctx) }))
    .filter((x) => x.status !== "HIDDEN");
}

export function isGroupAccessible(requiredUserMode: UserMode, ctx: PermissionContext): boolean {
  if (requiredUserMode === "FOUNDER") return ctx.founderActive;
  if (requiredUserMode === "ADVANCED") return ctx.userMode !== "PUBLIC" || ctx.founderActive;
  return true;
}
