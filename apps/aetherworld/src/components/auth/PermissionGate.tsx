// 页面级 / 区域级权限闸门组件。
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { ROLE_LABELS_ZH, PERMISSION_LABELS_ZH, type PermissionKey } from "@/lib/auth/authTypes";

interface Props {
  anyOf?: PermissionKey[];
  allOf?: PermissionKey[];
  /** 是否允许访客（默认 false）。 */
  allowGuest?: boolean;
  /** 自定义无权限渲染。 */
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({ anyOf, allOf, allowGuest = false, fallback, children }: Props) {
  const u = useCurrentUser();

  if (u.loading) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">权限校验中…</div>
    );
  }

  if (!u.isAuthenticated && !allowGuest) {
    return <DeniedView role="GUEST" required={anyOf ?? allOf ?? []} reason="NEED_LOGIN" />;
  }

  const ok =
    (!anyOf || anyOf.length === 0 || anyOf.some(u.hasPermission)) &&
    (!allOf || allOf.length === 0 || allOf.every(u.hasPermission));

  if (!ok) {
    return fallback ?? <DeniedView role={u.role as never} required={[...(anyOf ?? []), ...(allOf ?? [])]} reason="NO_PERMISSION" />;
  }
  return <>{children}</>;
}

function DeniedView({
  role,
  required,
  reason,
}: {
  role: keyof typeof ROLE_LABELS_ZH;
  required: PermissionKey[];
  reason: "NEED_LOGIN" | "NO_PERMISSION";
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="aether-card max-w-md w-full p-8 text-center">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Aetherworld · 权限闸门</div>
        <h2 className="mt-3 text-xl font-display">
          {reason === "NEED_LOGIN" ? "请先登录" : "你没有访问该内容的权限"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          当前角色：<span className="text-foreground">{ROLE_LABELS_ZH[role]}</span>
        </p>
        {required.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            所需权限：{required.map((k) => PERMISSION_LABELS_ZH[k] ?? k).join(" / ")}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {reason === "NEED_LOGIN" ? (
            <Link to="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">前往登录</Link>
          ) : (
            <Link to="/unauthorized" className="rounded-md border border-border bg-background px-4 py-2 text-sm">查看权限说明</Link>
          )}
          <Link to="/" className="rounded-md border border-border bg-background px-4 py-2 text-sm">返回主控台</Link>
        </div>
      </div>
    </div>
  );
}
