// Sidebar Governance Engine
import { UI_MODULE_CATEGORIES } from "@/constants/ui-update/uiModuleCategories";
import { UI_MODULE_REGISTRY, listModulesByCategory, type UIRequiredUserMode } from "./uiModuleRegistry";

export interface SidebarGroup {
  groupId: string;
  chineseName: string;
  englishName: string;
  items: { moduleId: string; chineseName: string; englishName: string; route: string; locked: boolean; gateReason?: string }[];
}

export interface SidebarPlan {
  audience: UIRequiredUserMode;
  groups: SidebarGroup[];
  totalItems: number;
  hiddenItems: string[];
}

export function generateSidebarPlan(audience: UIRequiredUserMode): SidebarPlan {
  const hidden: string[] = [];
  const groups: SidebarGroup[] = UI_MODULE_CATEGORIES
    .filter((c) => c.defaultVisibleTo.includes(audience))
    .map((c) => {
      const items = listModulesByCategory(c.id)
        .filter((m) => m.sidebarVisible && m.priority !== "HIDDEN")
        .map((m) => {
          const locked = m.requiredUserMode === "FOUNDER" && audience !== "FOUNDER";
          if (locked) hidden.push(m.moduleId);
          return {
            moduleId: m.moduleId,
            chineseName: m.chineseName,
            englishName: m.moduleName,
            route: m.route,
            locked,
            gateReason: locked ? "Founder 专属" : undefined,
          };
        })
        .filter((it) => !it.locked || audience === "ADVANCED"); // ADVANCED 可看到 Gate；PUBLIC 隐藏
      return { groupId: c.id, chineseName: c.chineseName, englishName: c.englishName, items };
    });

  const totalItems = groups.reduce((acc, g) => acc + g.items.length, 0);
  return { audience, groups, totalItems, hiddenItems: hidden };
}

export interface SidebarAuditIssue {
  moduleId: string;
  issue: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export function auditSidebar(plan: SidebarPlan): SidebarAuditIssue[] {
  const issues: SidebarAuditIssue[] = [];
  // 检测重复
  const seen = new Map<string, number>();
  for (const g of plan.groups) for (const it of g.items) {
    seen.set(it.route, (seen.get(it.route) ?? 0) + 1);
  }
  for (const [route, count] of seen) {
    if (count > 1) issues.push({ moduleId: route, issue: `路由 ${route} 在侧边栏出现 ${count} 次`, severity: "MEDIUM" });
  }
  // 普通用户不应看到 Founder 项
  if (plan.audience === "PUBLIC") {
    for (const g of plan.groups) for (const it of g.items) {
      const mod = UI_MODULE_REGISTRY.find((m) => m.moduleId === it.moduleId);
      if (mod?.requiredUserMode === "FOUNDER") {
        issues.push({ moduleId: it.moduleId, issue: "普通用户侧边栏暴露了 Founder 入口", severity: "CRITICAL" });
      }
    }
  }
  return issues;
}
