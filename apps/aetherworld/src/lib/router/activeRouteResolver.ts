/**
 * Active Route Resolver
 * 根据当前 path 找到所属 group / subGroup，并返回需要自动展开的 ids
 */
import {
  SUB_ROUTES,
  findRouteByPath,
  type SubRouteDefinition,
} from "@/constants/router/subRouteDefinitions";
import { evaluateSubRoutePermission, type PermissionContext, type PermissionStatus } from "./subRoutePermissionGuard";

export interface ActiveRouteResolution {
  currentPath: string;
  activeGroupId?: string;
  activeSubGroupId?: string;
  activeRouteId?: string;
  shouldExpandGroups: string[];
  shouldExpandSubGroups: string[];
  permissionStatus: PermissionStatus | "UNKNOWN";
  route?: SubRouteDefinition;
}

export function resolveActiveRoute(path: string, ctx: PermissionContext): ActiveRouteResolution {
  // 精确匹配优先，其次 startsWith
  let route = findRouteByPath(path);
  if (!route) {
    const candidates = SUB_ROUTES.filter((r) => path.startsWith(r.path) && r.path !== "/");
    candidates.sort((a, b) => b.path.length - a.path.length);
    route = candidates[0];
  }

  if (!route) {
    return {
      currentPath: path,
      shouldExpandGroups: [],
      shouldExpandSubGroups: [],
      permissionStatus: "UNKNOWN",
    };
  }

  return {
    currentPath: path,
    activeGroupId: route.groupId,
    activeSubGroupId: route.subGroupId,
    activeRouteId: route.routeId,
    shouldExpandGroups: [route.groupId],
    shouldExpandSubGroups: route.subGroupId ? [route.subGroupId] : [],
    permissionStatus: evaluateSubRoutePermission(route, ctx),
    route,
  };
}
