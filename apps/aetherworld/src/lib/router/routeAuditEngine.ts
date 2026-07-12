/**
 * Sub-Route Audit Engine
 * 检查 dead route / duplicate / permission leakage / 中文缺失等
 */
import { ROUTE_GROUPS, ROUTE_SUB_GROUPS } from "@/constants/router/routeGroups";
import { SUB_ROUTES, type SubRouteDefinition } from "@/constants/router/subRouteDefinitions";

export type AuditSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AuditIssue {
  id: string;
  severity: AuditSeverity;
  category: string;
  message: string;
  routeId?: string;
  path?: string;
}

export interface AuditReport {
  status: "PASS" | "WARN" | "FAIL";
  totalRoutes: number;
  totalGroups: number;
  totalSubGroups: number;
  issues: AuditIssue[];
}

export function runRouteAudit(): AuditReport {
  const issues: AuditIssue[] = [];

  // duplicate routeId
  const seenIds = new Map<string, SubRouteDefinition>();
  for (const r of SUB_ROUTES) {
    if (seenIds.has(r.routeId)) {
      issues.push({
        id: `dup-id-${r.routeId}`,
        severity: "HIGH",
        category: "DUPLICATE_ROUTE_ID",
        message: `重复的 routeId：${r.routeId}`,
        routeId: r.routeId,
      });
    } else seenIds.set(r.routeId, r);
  }

  // duplicate path（不同 routeId 共用相同 path 是允许的别名，但需要 INFO 标注）
  const pathMap = new Map<string, SubRouteDefinition[]>();
  for (const r of SUB_ROUTES) {
    const list = pathMap.get(r.path) ?? [];
    list.push(r);
    pathMap.set(r.path, list);
  }
  pathMap.forEach((list, p) => {
    if (list.length > 1) {
      issues.push({
        id: `dup-path-${p}`,
        severity: "INFO",
        category: "DUPLICATE_PATH",
        message: `路径 ${p} 被 ${list.length} 个子路由共享：${list.map((r) => r.routeId).join(", ")}`,
        path: p,
      });
    }
  });

  // 中文名缺失
  for (const r of SUB_ROUTES) {
    if (!r.chineseTitle) {
      issues.push({
        id: `no-zh-${r.routeId}`,
        severity: "MEDIUM",
        category: "MISSING_CHINESE_TITLE",
        message: `子路由缺少中文名：${r.routeId}`,
        routeId: r.routeId,
      });
    }
  }

  // group 引用合法性
  const groupIds = new Set(ROUTE_GROUPS.map((g) => g.groupId));
  const subGroupIds = new Set(ROUTE_SUB_GROUPS.map((s) => s.subGroupId));
  for (const r of SUB_ROUTES) {
    if (!groupIds.has(r.groupId)) {
      issues.push({
        id: `orphan-group-${r.routeId}`,
        severity: "HIGH",
        category: "ORPHAN_GROUP",
        message: `子路由 ${r.routeId} 引用了不存在的 group：${r.groupId}`,
        routeId: r.routeId,
      });
    }
    if (r.subGroupId && !subGroupIds.has(r.subGroupId)) {
      issues.push({
        id: `orphan-sub-${r.routeId}`,
        severity: "HIGH",
        category: "ORPHAN_SUB_GROUP",
        message: `子路由 ${r.routeId} 引用了不存在的 subGroup：${r.subGroupId}`,
        routeId: r.routeId,
      });
    }
  }

  // Founder 暴露：founderOnly 但 requiredUserMode 不是 FOUNDER
  for (const r of SUB_ROUTES) {
    if (r.founderOnly && r.requiredUserMode !== "FOUNDER") {
      issues.push({
        id: `founder-leak-${r.routeId}`,
        severity: "CRITICAL",
        category: "FOUNDER_PERMISSION_LEAK",
        message: `Founder-only 路由权限不一致：${r.routeId} 应设为 FOUNDER`,
        routeId: r.routeId,
      });
    }
  }

  const critical = issues.some((i) => i.severity === "CRITICAL");
  const high = issues.some((i) => i.severity === "HIGH");
  const status: AuditReport["status"] = critical ? "FAIL" : high ? "WARN" : "PASS";

  return {
    status,
    totalRoutes: SUB_ROUTES.length,
    totalGroups: ROUTE_GROUPS.length,
    totalSubGroups: ROUTE_SUB_GROUPS.length,
    issues,
  };
}
