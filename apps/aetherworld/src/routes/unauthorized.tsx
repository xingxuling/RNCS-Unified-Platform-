import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { ROLE_LABELS_ZH } from "@/lib/auth/authTypes";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({ meta: [{ title: "无权限 · Aetherworld" }] }),
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  const u = useCurrentUser();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="aether-card max-w-lg w-full p-10 text-center">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Aetherworld · 权限闸门</div>
        <h1 className="mt-3 text-3xl font-display">无访问权限</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          你当前没有访问该页面的权限。如需访问，请联系创始人或管理员。
        </p>
        <div className="mt-6 grid gap-3 text-left text-sm">
          <div className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-muted-foreground">当前角色</span>
            <span>{ROLE_LABELS_ZH[u.role]}</span>
          </div>
          <div className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-muted-foreground">登录状态</span>
            <span>{u.isAuthenticated ? "已登录" : "未登录"}</span>
          </div>
          {u.email && (
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">账号</span>
              <span className="font-mono text-xs">{u.email}</span>
            </div>
          )}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {!u.isAuthenticated && (
            <Link to="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">前往登录</Link>
          )}
          <Link to="/" className="rounded-md border border-border bg-background px-4 py-2 text-sm">返回主控台</Link>
          <Link to="/account" className="rounded-md border border-border bg-background px-4 py-2 text-sm">我的账户</Link>
        </div>
        <p className="mt-6 text-[11px] text-muted-foreground">
          高级权限（如创始人专属、本地执行网关、自动训练等）默认仅限创始人使用。
        </p>
      </div>
    </div>
  );
}
