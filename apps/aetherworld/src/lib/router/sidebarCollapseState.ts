/**
 * Sidebar Collapse State 本地持久化
 */
import {
  SIDEBAR_COLLAPSE_STORAGE_KEY,
  defaultCollapseState,
  type SidebarCollapseState,
} from "@/constants/router/sidebarCollapseDefaults";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readCollapseState(): SidebarCollapseState {
  if (!isBrowser()) return defaultCollapseState();
  try {
    const raw = window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);
    if (!raw) return defaultCollapseState();
    const parsed = JSON.parse(raw) as SidebarCollapseState;
    if (!Array.isArray(parsed.expandedGroupIds)) return defaultCollapseState();
    return {
      expandedGroupIds: parsed.expandedGroupIds ?? [],
      expandedSubGroupIds: parsed.expandedSubGroupIds ?? [],
      lastUpdatedAt: parsed.lastUpdatedAt ?? new Date().toISOString(),
    };
  } catch {
    return defaultCollapseState();
  }
}

export function writeCollapseState(state: SidebarCollapseState): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSE_STORAGE_KEY,
      JSON.stringify({ ...state, lastUpdatedAt: new Date().toISOString() }),
    );
  } catch {
    /* ignore quota errors */
  }
}

export function toggleGroup(state: SidebarCollapseState, groupId: string): SidebarCollapseState {
  const has = state.expandedGroupIds.includes(groupId);
  return {
    ...state,
    expandedGroupIds: has
      ? state.expandedGroupIds.filter((g) => g !== groupId)
      : [...state.expandedGroupIds, groupId],
  };
}

export function toggleSubGroup(state: SidebarCollapseState, subGroupId: string): SidebarCollapseState {
  const has = state.expandedSubGroupIds.includes(subGroupId);
  return {
    ...state,
    expandedSubGroupIds: has
      ? state.expandedSubGroupIds.filter((s) => s !== subGroupId)
      : [...state.expandedSubGroupIds, subGroupId],
  };
}

export function expandAll(allGroupIds: string[], allSubGroupIds: string[]): SidebarCollapseState {
  return {
    expandedGroupIds: [...allGroupIds],
    expandedSubGroupIds: [...allSubGroupIds],
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function collapseAll(): SidebarCollapseState {
  return {
    expandedGroupIds: [],
    expandedSubGroupIds: [],
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function ensureGroupExpanded(state: SidebarCollapseState, groupIds: string[]): SidebarCollapseState {
  const merged = new Set([...state.expandedGroupIds, ...groupIds]);
  return { ...state, expandedGroupIds: Array.from(merged) };
}

export function ensureSubGroupExpanded(state: SidebarCollapseState, subGroupIds: string[]): SidebarCollapseState {
  const merged = new Set([...state.expandedSubGroupIds, ...subGroupIds]);
  return { ...state, expandedSubGroupIds: Array.from(merged) };
}
