import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth/authActions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "账户 · Aetherworld" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, roles, loading } = useAuth();
  const nav = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", search: { redirect: "/account" } as any });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      setDisplayName(data?.display_name ?? "");
    });
    supabase.from("workspaces").select("id,name").order("created_at").then(({ data }) => {
      setWorkspaces((data ?? []) as any);
    });
  }, [user]);

  if (loading || !user) return <div className="p-6 text-sm text-muted-foreground">加载中…</div>;

  const save = async () => {
    const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: displayName });
    if (error) return toast.error("保存失败：" + error.message);
    toast.success("已保存");
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <header>
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Account</div>
        <h1 className="text-xl font-display mt-1">账户</h1>
      </header>

      <section className="aether-card p-4 space-y-3">
        <div className="text-sm font-medium">基本信息</div>
        <div className="text-xs text-muted-foreground">邮箱：{user.email}</div>
        <div>
          <label className="text-xs text-muted-foreground">显示名称</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full bg-transparent border border-border/40 rounded-md px-3 py-2 text-sm" />
        </div>
        <button onClick={save} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs">保存</button>
      </section>

      <section className="aether-card p-4 space-y-2">
        <div className="text-sm font-medium">权限</div>
        <div className="flex flex-wrap gap-2 text-[10px]">
          {roles.length === 0 && <span className="text-muted-foreground">无</span>}
          {roles.map((r) => (
            <span key={r} className="px-2 py-0.5 rounded-md border border-border/40">{labelOfRole(r)}</span>
          ))}
        </div>
      </section>

      <section className="aether-card p-4 space-y-2">
        <div className="text-sm font-medium">我的工作区</div>
        <ul className="space-y-1 text-xs">
          {workspaces.map((w) => <li key={w.id} className="text-muted-foreground">· {w.name}</li>)}
          {workspaces.length === 0 && <li className="text-muted-foreground">暂无工作区</li>}
        </ul>
        <Link to="/workspace-switcher" className="text-xs underline">切换工作区</Link>
      </section>

      <section className="aether-card p-4 space-y-3">
        <div className="text-sm font-medium">数据迁移</div>
        <p className="text-xs text-muted-foreground">将本地 localStorage 中的工作区数据迁移到你的账户。</p>
        <Link to="/account/settings" className="text-xs underline">前往设置</Link>
      </section>

      <div className="flex gap-2">
        <button onClick={async () => { await signOut(); nav({ to: "/login" }); }}
          className="px-3 py-1.5 rounded-md border border-border/40 text-xs">退出登录</button>
        <Link to="/account/security" className="px-3 py-1.5 rounded-md border border-border/40 text-xs">安全设置</Link>
      </div>
    </div>
  );
}

function labelOfRole(r: string) {
  return { normal_user: "普通用户", advanced_user: "高阶用户", founder: "创始人", admin: "管理员" }[r] ?? r;
}
