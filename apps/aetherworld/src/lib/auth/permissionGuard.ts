// 路由 / 菜单权限保护工具。
import type { AetherRole, PermissionKey } from "./authTypes";
import { roleHasPermission } from "./rolePermissions";

export interface RouteGuardRule {
  path: string;
  /** 任一权限命中即放行；为空表示无需权限（仅需登录）。 */
  anyOf?: PermissionKey[];
  /** 是否允许访客访问。默认 false。 */
  allowGuest?: boolean;
}

/**
 * 路由保护表。注意：这是声明式策略表，不直接生效在 routeTree。
 * 页面级组件请使用 <PermissionGate> 或 useCurrentUser().hasPermission()。
 */
export const ROUTE_GUARDS: RouteGuardRule[] = [
  // 创始人专属
  { path: "/system/local-gateway", anyOf: ["MANAGE_LOCAL_GATEWAY", "FOUNDER_ONLY"] },
  { path: "/system/auto-training", anyOf: ["RUN_AUTO_TRAINING"] },
  { path: "/system-bug-audit", anyOf: ["VIEW_AUDIT"] },
  { path: "/system/page-completeness", anyOf: ["VIEW_AUDIT"] },
  { path: "/system/route-health", anyOf: ["VIEW_AUDIT"] },
  { path: "/system/model-providers", anyOf: ["MANAGE_AI_PROVIDERS", "FOUNDER_ONLY"] },
  { path: "/founder-console", anyOf: ["FOUNDER_ONLY"] },
  { path: "/founder-permissions", anyOf: ["FOUNDER_ONLY"] },
  { path: "/founder-audit", anyOf: ["FOUNDER_ONLY"] },
  // 管理员以上
  { path: "/system/user-management", anyOf: ["MANAGE_USERS"] },
  { path: "/system/capability-assets", anyOf: ["VIEW_STORE"] },
  // 高级用户以上
  { path: "/system/user-assets", anyOf: ["UPLOAD_USER_ASSET"] },
  { path: "/system/datasets", anyOf: ["CREATE_DATASET"] },
  { path: "/system/intake-forge", anyOf: ["CREATE_DATASET"] },
  // 公开
  { path: "/", allowGuest: true },
  { path: "/login", allowGuest: true },
  { path: "/register", allowGuest: true },
  { path: "/unauthorized", allowGuest: true },
];

export function canAccessRoute(path: string, role: AetherRole): boolean {
  const rule = ROUTE_GUARDS.find((r) => r.path === path);
  if (!rule) return true; // 未声明保护 = 不强制
  if (role === "GUEST") return !!rule.allowGuest;
  if (!rule.anyOf || rule.anyOf.length === 0) return true;
  return rule.anyOf.some((k) => roleHasPermission(role, k));
}
