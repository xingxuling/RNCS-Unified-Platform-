/**
 * Collapsible Sidebar Group
 *
 * 可折叠侧边栏分组（包含父组 + 可选二级子组 + 子路由）
 * 通过 useCollapsibleSidebar hook 共享状态
 */
import { useMemo } from "react";
import { useRouterState } from "@tanstack/react-router";
import { resolveAllRouteGroups } from "@/lib/router/routeGroupRegistry";
import {
  filterVisibleRoutes,
  isGroupAccessible,
  type PermissionContext,
} from "@/lib/router/subRoutePermissionGuard";
import { resolveActiveRoute } from "@/lib/router/activeRouteResolver";
import { SidebarParentItem } from "./SidebarParentItem";
import { SidebarChildItem } from "./SidebarChildItem";
import { useCollapsibleSidebar } from "@/hooks/useCollapsibleSidebar";

interface Props {
  permissionContext: PermissionContext;
  onNavigate?: () => void;
}

export function CollapsibleSidebarGroup({ permissionContext, onNavigate }: Props) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const groups = useMemo(() => resolveAllRouteGroups(), []);
  const active = useMemo(() => resolveActiveRoute(path, permissionContext), [path, permissionContext]);
  const { state, toggleGroupById, toggleSubGroupById, isGroupExpanded, isSubGroupExpanded } =
    useCollapsibleSidebar(active);

  void state;

  return (
    <div className="px-2 space-y-1">
      {groups.map(({ group, directRoutes, subGroups }) => {
        if (!isGroupAccessible(group.requiredUserMode, permissionContext)) return null;

        const visibleDirect = filterVisibleRoutes(directRoutes, permissionContext);
        const hasContent =
          visibleDirect.length > 0 ||
          subGroups.some((s) => filterVisibleRoutes(s.routes, permissionContext).length > 0);
        if (!hasContent) return null;

        const expanded = isGroupExpanded(group.groupId);

        return (
          <div key={group.groupId} className="rounded-md">
            <SidebarParentItem
              title={group.title}
              chineseTitle={group.chineseTitle}
              expanded={expanded}
              onToggle={() => toggleGroupById(group.groupId)}
            />

            {expanded && (
              <div className="mt-0.5 mb-1 space-y-0.5">
                {visibleDirect.map(({ route, status }) => (
                  <SidebarChildItem
                    key={route.routeId}
                    route={route}
                    status={status}
                    active={active.activeRouteId === route.routeId}
                    indent={1}
                    onNavigate={onNavigate}
                  />
                ))}

                {subGroups.map(({ subGroup, routes }) => {
                  const visible = filterVisibleRoutes(routes, permissionContext);
                  if (visible.length === 0) return null;
                  const subExpanded = isSubGroupExpanded(subGroup.subGroupId);

                  return (
                    <div key={subGroup.subGroupId} className="ml-2 mt-1">
                      <button
                        type="button"
                        onClick={() => toggleSubGroupById(subGroup.subGroupId)}
                        aria-expanded={subExpanded}
                        className="w-full flex items-center gap-1 px-1.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                      >
                        <span className="flex-1 text-left">
                          {subGroup.chineseTitle}
                          <span className="ml-1 opacity-60">{subGroup.title}</span>
                        </span>
                        <span aria-hidden>{subExpanded ? "−" : "+"}</span>
                      </button>
                      {subExpanded && (
                        <div className="space-y-0.5">
                          {visible.map(({ route, status }) => (
                            <SidebarChildItem
                              key={route.routeId}
                              route={route}
                              status={status}
                              active={active.activeRouteId === route.routeId}
                              indent={2}
                              onNavigate={onNavigate}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
