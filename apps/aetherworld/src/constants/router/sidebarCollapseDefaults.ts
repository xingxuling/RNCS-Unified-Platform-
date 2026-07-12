/**
 * Sidebar 默认折叠配置
 */
import { ROUTE_GROUPS, ROUTE_SUB_GROUPS } from "./routeGroups";

export const SIDEBAR_COLLAPSE_STORAGE_KEY = "aether_sidebar_collapse_state";

export interface SidebarCollapseState {
  expandedGroupIds: string[];
  expandedSubGroupIds: string[];
  lastUpdatedAt: string;
}

export function defaultCollapseState(): SidebarCollapseState {
  return {
    expandedGroupIds: ROUTE_GROUPS.filter((g) => g.defaultExpanded).map((g) => g.groupId),
    expandedSubGroupIds: ROUTE_SUB_GROUPS.filter((s) => s.defaultExpanded).map((s) => s.subGroupId),
    lastUpdatedAt: new Date().toISOString(),
  };
}
