// Aetherworld 当前用户 hook（v0.1）。包装 useAuth，输出 AetherRole + 权限工具。
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { dbRoleToAether, type AetherRole, type PermissionKey } from "./authTypes";
import { roleHasPermission } from "./rolePermissions";

export interface CurrentUserState {
  loading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  role: AetherRole;
  isFounder: boolean;
  isAdmin: boolean;
  isProUser: boolean;
  isGuest: boolean;
  hasPermission: (key: PermissionKey) => boolean;
  hasAnyPermission: (keys: PermissionKey[]) => boolean;
  hasAllPermissions: (keys: PermissionKey[]) => boolean;
}

export function useCurrentUser(): CurrentUserState {
  const { user, roles, loading } = useAuth();
  return useMemo(() => {
    const role = dbRoleToAether(roles, !!user);
    const hasPermission = (k: PermissionKey) => roleHasPermission(role, k);
    return {
      loading,
      isAuthenticated: !!user,
      userId: user?.id ?? null,
      email: user?.email ?? null,
      displayName:
        (user?.user_metadata?.display_name as string | undefined) ??
        user?.email?.split("@")[0] ??
        null,
      role,
      isFounder: role === "FOUNDER",
      isAdmin: role === "ADMIN" || role === "FOUNDER",
      isProUser: role === "PRO_USER" || role === "ADMIN" || role === "FOUNDER",
      isGuest: role === "GUEST",
      hasPermission,
      hasAnyPermission: (keys) => keys.some(hasPermission),
      hasAllPermissions: (keys) => keys.every(hasPermission),
    };
  }, [user, roles, loading]);
}
