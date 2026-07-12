// 非 React 上下文中的权限检查。由 chat、自动训练等运行时使用。
import { supabase } from "@/integrations/supabase/client";
import { dbRoleToAether, type AetherRole, type PermissionKey } from "./authTypes";
import { roleHasPermission } from "./rolePermissions";

export interface RuntimeUser {
  userId: string | null;
  email: string | null;
  role: AetherRole;
}

export async function getCurrentRuntimeUser(): Promise<RuntimeUser> {
  const { data: sessionRes } = await supabase.auth.getSession();
  const u = sessionRes.session?.user ?? null;
  if (!u) return { userId: null, email: null, role: "GUEST" };
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
  const roles = (data ?? []).map((r) => r.role as "normal_user" | "advanced_user" | "founder" | "admin");
  return { userId: u.id, email: u.email ?? null, role: dbRoleToAether(roles, true) };
}

export async function runtimeHasPermission(key: PermissionKey): Promise<boolean> {
  const u = await getCurrentRuntimeUser();
  return roleHasPermission(u.role, key);
}

/** 抛错版本，用于服务端 / 高风险动作前置 Gate。 */
export async function requireRuntimePermission(key: PermissionKey): Promise<RuntimeUser> {
  const u = await getCurrentRuntimeUser();
  if (!roleHasPermission(u.role, key)) {
    throw new Error(`PERMISSION_DENIED:${key}`);
  }
  return u;
}
