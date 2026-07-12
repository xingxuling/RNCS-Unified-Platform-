/**
 * Route Group 一级分组定义
 * Collapsible Sub-Router System
 */

export type UserMode = "PUBLIC" | "ADVANCED" | "FOUNDER";
export type SubjectMode = "ANY" | "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";

export interface RouteGroupMeta {
  groupId: string;
  title: string;             // English
  chineseTitle: string;
  icon?: string;             // lucide icon name (string, resolved at render)
  baseRoute?: string;
  priority: number;
  defaultExpanded: boolean;
  requiredUserMode: UserMode;
  requiredSubjectMode?: SubjectMode;
}

export const ROUTE_GROUPS: RouteGroupMeta[] = [
  { groupId: "START",        title: "Start",        chineseTitle: "开始",     icon: "PlayCircle",     priority: 10,  defaultExpanded: true,  requiredUserMode: "PUBLIC" },
  { groupId: "CREATE",       title: "Create",       chineseTitle: "创造",     icon: "Sparkles",       priority: 20,  defaultExpanded: true,  requiredUserMode: "PUBLIC" },
  { groupId: "SEQUENCE",     title: "Sequence",     chineseTitle: "数列",     icon: "Binary",         priority: 30,  defaultExpanded: false, requiredUserMode: "PUBLIC" },
  { groupId: "WORLD_ENGINE", title: "World Engine", chineseTitle: "世界引擎", icon: "Orbit",          priority: 40,  defaultExpanded: false, requiredUserMode: "PUBLIC" },
  { groupId: "KNOWLEDGE",    title: "Knowledge",    chineseTitle: "知识",     icon: "Library",        priority: 50,  defaultExpanded: false, requiredUserMode: "PUBLIC" },
  { groupId: "SYSTEM",       title: "System",       chineseTitle: "系统",     icon: "ShieldCheck",    priority: 60,  defaultExpanded: false, requiredUserMode: "PUBLIC" },
  { groupId: "QUALITY",      title: "Quality",      chineseTitle: "质量",     icon: "ClipboardCheck", priority: 70,  defaultExpanded: false, requiredUserMode: "ADVANCED" },
  { groupId: "FOUNDER",      title: "Founder",      chineseTitle: "创始人",   icon: "Crown",          priority: 80,  defaultExpanded: false, requiredUserMode: "FOUNDER" },
];

/** World Engine 二级子组 */
export interface SubGroupMeta {
  subGroupId: string;
  parentGroupId: string;
  title: string;
  chineseTitle: string;
  priority: number;
  defaultExpanded: boolean;
}

export const ROUTE_SUB_GROUPS: SubGroupMeta[] = [
  { subGroupId: "WORLD_CORE",     parentGroupId: "WORLD_ENGINE", title: "World Core",     chineseTitle: "世界核心",  priority: 10, defaultExpanded: false },
  { subGroupId: "WORLD_GROWTH",   parentGroupId: "WORLD_ENGINE", title: "World Growth",   chineseTitle: "世界生长",  priority: 20, defaultExpanded: false },
  { subGroupId: "WORLD_SOCIETY",  parentGroupId: "WORLD_ENGINE", title: "World Society",  chineseTitle: "世界社会",  priority: 30, defaultExpanded: false },
  { subGroupId: "CIVILIZATION",   parentGroupId: "WORLD_ENGINE", title: "Civilization",   chineseTitle: "文明历史",  priority: 40, defaultExpanded: false },
  { subGroupId: "PRESENTATION",   parentGroupId: "WORLD_ENGINE", title: "Presentation",   chineseTitle: "世界表现",  priority: 50, defaultExpanded: false },
];

export function getRouteGroup(groupId: string): RouteGroupMeta | undefined {
  return ROUTE_GROUPS.find((g) => g.groupId === groupId);
}

export function getSubGroupsOf(groupId: string): SubGroupMeta[] {
  return ROUTE_SUB_GROUPS.filter((s) => s.parentGroupId === groupId);
}
