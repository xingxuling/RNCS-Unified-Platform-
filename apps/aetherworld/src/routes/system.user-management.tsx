import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { ROLE_LABELS_ZH, dbRoleToAether, type AetherRole } from "@/lib/auth/authTypes";
import { auditUserAction } from "@/lib/auth/authAuditBridge";
import { toast } from "sonner";

export const Route = createFileRoute("/system/user-management")({
  head: () => ({ meta: [{ title: "用户管理 · Aetherworld" }] }),
  component: () => (
    <PermissionGate anyOf={["MANAGE_USERS"]}>
      <UserManagementPage />
    </PermissionGate>
  ),
});

interface ProfileRow {
  id: string;
  display_name: string | null;
  created_at: string;
  role: AetherRole;
  rawRoles: string[];
}

function UserManagementPage() {
  const me = useCurrentUser();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: rolesData }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const roleMap = new Map<string, string[]>();
    (rolesData ?? []).forEach((r: { user_id: string; role: string }) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });
    setRows(
      (profiles ?? []).map((p: { id: string; display_name: string | null; created_at: string }) => {
        const raw = roleMap.get(p.id) ?? [];
        return {
          id: p.id,
          display_name: p.display_name,
          created_at: p.created_at,
          role: dbRoleToAether(raw as never, true),
          rawRoles: raw,
        };
      }),
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (userId: string, newRole: "normal_user" | "advanced_user" | "admin") => {
    if (!me.isFounder && newRole === "admin") {
      toast.error("只有创始人可以设置管理员");
      return;
    }
    setBusy(userId);
    // 删除非 founder 的旧角色，再插入新角色
    const { error: delErr } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .neq("role", "founder");
    if (delErr) {
      toast.error("更新失败：" + delErr.message);
      setBusy(null);
      return;
    }
    const { error: insErr } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });
    if (insErr) {
      toast.error("更新失败：" + insErr.message);
      setBusy(null);
      return;
    }
    await auditUserAction({
      action: "change_user_role",
      targetType: "user",
      targetId: userId,
      riskLevel: "HIGH",
      metadata: { newRole },
    });
    toast.success("角色已更新");
    await load();
    setBusy(null);
  };

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Aetherworld · 管理后台</div>
          <h1 className="text-2xl font-display mt-1">用户管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            可修改普通用户 / 高级用户 / 管理员角色。
            {me.isFounder ? "创始人模式：可设置管理员。" : "管理员模式：不能设置或修改创始人。"}
          </p>
        </div>
        <button onClick={load} className="rounded-md border border-border px-3 py-1.5 text-sm">刷新</button>
      </div>

      <div className="aether-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">显示名</th>
              <th className="text-left px-4 py-3">用户 ID</th>
              <th className="text-left px-4 py-3">当前角色</th>
              <th className="text-left px-4 py-3">注册时间</th>
              <th className="text-left px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">加载中…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">暂无用户</td></tr>
            )}
            {rows.map((r) => {
              const isFounder = r.rawRoles.includes("founder");
              const isSelf = r.id === me.userId;
              const disabled = isFounder || isSelf || busy === r.id;
              return (
                <tr key={r.id} className="border-t border-border/40 hover:bg-muted/20">
                  <td className="px-4 py-3">{r.display_name ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{r.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <span className="rounded border border-border px-1.5 py-0.5 text-xs">
                      {ROLE_LABELS_ZH[r.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    {disabled ? (
                      <span className="text-xs text-muted-foreground">
                        {isFounder ? "创始人受保护" : isSelf ? "不能修改自己" : "处理中…"}
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => changeRole(r.id, "normal_user")}
                          className="text-xs rounded border border-border px-2 py-1 hover:bg-muted">
                          设为普通用户
                        </button>
                        <button onClick={() => changeRole(r.id, "advanced_user")}
                          className="text-xs rounded border border-border px-2 py-1 hover:bg-muted">
                          设为高级用户
                        </button>
                        {me.isFounder && (
                          <button onClick={() => changeRole(r.id, "admin")}
                            className="text-xs rounded border border-amber-500/40 text-amber-300 px-2 py-1 hover:bg-amber-500/10">
                            设为管理员
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-xs text-muted-foreground space-y-1">
        <div>· 创始人角色不能通过 UI 修改。如需指派，请通过数据库手动设置 user_roles.role = 'founder'。</div>
        <div>· 所有角色变更会写入 audit_logs，risk_level = HIGH。</div>
        <div>· 管理员不能将自己升为创始人，也不能修改任何创始人的角色。</div>
      </div>
    </div>
  );
}
