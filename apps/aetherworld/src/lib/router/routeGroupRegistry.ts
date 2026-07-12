/**
 * Route Group Registry
 * 把 RouteGroup + SubGroup + SubRoute 整合成可供 sidebar / audit 使用的结构
 */
import { ROUTE_GROUPS, ROUTE_SUB_GROUPS, type RouteGroupMeta, type SubGroupMeta } from "@/constants/router/routeGroups";
import {
  SUB_ROUTES,
  getSubRoutesByGroup,
  getSubRoutesBySubGroup,
  type SubRouteDefinition,
} from "@/constants/router/subRouteDefinitions";

export interface ResolvedRouteGroup {
  group: RouteGroupMeta;
  /** 直接挂在 group 下、没有 subGroup 的子路由 */
  directRoutes: SubRouteDefinition[];
  subGroups: {
    subGroup: SubGroupMeta;
    routes: SubRouteDefinition[];
  }[];
}

export function resolveAllRouteGroups(): ResolvedRouteGroup[] {
  return [...ROUTE_GROUPS]
    .sort((a, b) => a.priority - b.priority)
    .map((group) => {
      const subGroups = ROUTE_SUB_GROUPS
        .filter((s) => s.parentGroupId === group.groupId)
        .sort((a, b) => a.priority - b.priority)
        .map((subGroup) => ({
          subGroup,
          routes: getSubRoutesBySubGroup(subGroup.subGroupId),
        }));

      const directRoutes = getSubRoutesByGroup(group.groupId).filter((r) => !r.subGroupId);

      return { group, directRoutes, subGroups };
    });
}

export function listAllRoutes(): SubRouteDefinition[] {
  return SUB_ROUTES;
}

export function searchRoutes(query: string): SubRouteDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SUB_ROUTES.filter((r) =>
    r.title.toLowerCase().includes(q) ||
    r.chineseTitle.toLowerCase().includes(q) ||
    r.path.toLowerCase().includes(q) ||
    r.routeId.toLowerCase().includes(q),
  );
}
