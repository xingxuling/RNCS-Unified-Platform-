import { ROLE_PERMISSIONS, type WorldPermission } from "@/constants/sequence-world/growth/worldPermissionTypes";

export type WorldRole = "BEGINNER" | "ADVANCED" | "FOUNDER";

export interface PermissionContext {
  role: WorldRole;
  isFull60?: boolean;
  isDemo?: boolean;
}

export function hasPermission(ctx: PermissionContext, perm: WorldPermission): boolean {
  return ROLE_PERMISSIONS[ctx.role].includes(perm);
}

export function checkPermission(ctx: PermissionContext, perm: WorldPermission): { ok: boolean; reason?: string } {
  if (!hasPermission(ctx, perm)) return { ok: false, reason: `当前角色 ${ctx.role} 无权限：${perm}` };
  if (perm === "EXPORT_RUNTIME" && ctx.isFull60) return { ok: true, reason: "Full60 世界导出需用户二次确认" };
  if (perm === "LOCK_CANON" && ctx.role !== "FOUNDER") return { ok: false, reason: "锁定正典仅限 Founder" };
  if (perm === "DELETE_WORLD" && ctx.role !== "FOUNDER") return { ok: false, reason: "删除世界仅限 Founder" };
  return { ok: true };
}

export function canWriteCanon(ctx: PermissionContext, currentLevel: string): boolean {
  if (currentLevel === "FOUNDER_LOCKED") return ctx.role === "FOUNDER";
  if (currentLevel === "HARD_CANON") return ctx.role === "FOUNDER" || ctx.role === "ADVANCED";
  return true;
}
