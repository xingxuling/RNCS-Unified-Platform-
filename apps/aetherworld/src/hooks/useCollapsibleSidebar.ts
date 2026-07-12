/**
 * useCollapsibleSidebar
 * Sidebar 折叠状态 + 当前路由自动展开 + localStorage 持久化
 */
import { useCallback, useEffect, useState } from "react";
import {
  readCollapseState,
  writeCollapseState,
  toggleGroup,
  toggleSubGroup,
  ensureGroupExpanded,
  ensureSubGroupExpanded,
  expandAll,
  collapseAll,
} from "@/lib/router/sidebarCollapseState";
import type { SidebarCollapseState } from "@/constants/router/sidebarCollapseDefaults";
import type { ActiveRouteResolution } from "@/lib/router/activeRouteResolver";
import { ROUTE_GROUPS, ROUTE_SUB_GROUPS } from "@/constants/router/routeGroups";

export function useCollapsibleSidebar(active: ActiveRouteResolution) {
  const [state, setState] = useState<SidebarCollapseState>(() => readCollapseState());

  // 当前路由变化时自动展开对应 group / subGroup
  useEffect(() => {
    if (!active.activeGroupId && active.shouldExpandGroups.length === 0) return;
    setState((prev) => {
      let next = ensureGroupExpanded(prev, active.shouldExpandGroups);
      if (active.shouldExpandSubGroups.length > 0) {
        next = ensureSubGroupExpanded(next, active.shouldExpandSubGroups);
      }
      writeCollapseState(next);
      return next;
    });
  }, [active.activeGroupId, active.activeSubGroupId, active.shouldExpandGroups.join("|"), active.shouldExpandSubGroups.join("|")]);

  const persist = useCallback((next: SidebarCollapseState) => {
    setState(next);
    writeCollapseState(next);
  }, []);

  const toggleGroupById = useCallback((groupId: string) => {
    setState((prev) => {
      const next = toggleGroup(prev, groupId);
      writeCollapseState(next);
      return next;
    });
  }, []);

  const toggleSubGroupById = useCallback((subGroupId: string) => {
    setState((prev) => {
      const next = toggleSubGroup(prev, subGroupId);
      writeCollapseState(next);
      return next;
    });
  }, []);

  const expandEverything = useCallback(() => {
    persist(
      expandAll(
        ROUTE_GROUPS.map((g) => g.groupId),
        ROUTE_SUB_GROUPS.map((s) => s.subGroupId),
      ),
    );
  }, [persist]);

  const collapseEverything = useCallback(() => persist(collapseAll()), [persist]);

  return {
    state,
    isGroupExpanded: (id: string) => state.expandedGroupIds.includes(id),
    isSubGroupExpanded: (id: string) => state.expandedSubGroupIds.includes(id),
    toggleGroupById,
    toggleSubGroupById,
    expandEverything,
    collapseEverything,
  };
}
