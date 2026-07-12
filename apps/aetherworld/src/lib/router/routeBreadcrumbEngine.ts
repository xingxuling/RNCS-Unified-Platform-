/**
 * Route Breadcrumb Engine
 */
import { getRouteGroup, ROUTE_SUB_GROUPS } from "@/constants/router/routeGroups";
import { findRouteByPath } from "@/constants/router/subRouteDefinitions";

export interface BreadcrumbItem {
  label: string;
  chineseLabel: string;
  path?: string;
}

export function buildBreadcrumbs(path: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ label: "Home", chineseLabel: "首页", path: "/" }];

  const route = findRouteByPath(path);
  if (!route) return crumbs;

  const group = getRouteGroup(route.groupId);
  if (group) {
    crumbs.push({ label: group.title, chineseLabel: group.chineseTitle });
  }

  if (route.subGroupId) {
    const sub = ROUTE_SUB_GROUPS.find((s) => s.subGroupId === route.subGroupId);
    if (sub) crumbs.push({ label: sub.title, chineseLabel: sub.chineseTitle });
  }

  crumbs.push({ label: route.title, chineseLabel: route.chineseTitle, path: route.path });
  return crumbs;
}
