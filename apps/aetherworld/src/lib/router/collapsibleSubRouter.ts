/**
 * Collapsible Sub-Router 主入口
 * 聚合 registry + collapse state + active resolver + permission guard
 */
export { resolveAllRouteGroups, listAllRoutes, searchRoutes } from "./routeGroupRegistry";
export { resolveActiveRoute, type ActiveRouteResolution } from "./activeRouteResolver";
export {
  readCollapseState,
  writeCollapseState,
  toggleGroup,
  toggleSubGroup,
  expandAll,
  collapseAll,
  ensureGroupExpanded,
  ensureSubGroupExpanded,
} from "./sidebarCollapseState";
export {
  evaluateSubRoutePermission,
  filterVisibleRoutes,
  isGroupAccessible,
  type PermissionContext,
  type PermissionStatus,
} from "./subRoutePermissionGuard";
export { buildBreadcrumbs, type BreadcrumbItem } from "./routeBreadcrumbEngine";
export { runRouteAudit, type AuditReport, type AuditIssue, type AuditSeverity } from "./routeAuditEngine";
