import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/account/security")({
  head: () => ({ meta: [{ title: "安全设置 · Aetherworld" }] }),
  component: SecurityPage,
});

function SecurityPage() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const update = async () => {
    if (pw.length < 8) return toast.error("密码至少 8 位");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error("更新失败：" + error.message);
    toast.success("密码已更新"); setPw("");
  };
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-5">
      <header>
        <Link to="/account" className="text-xs text-muted-foreground">← 返回账户</Link>
        <h1 className="text-xl font-display mt-1">安全设置</h1>
      </header>
      <section className="aether-card p-4 space-y-3">
        <div className="text-sm font-medium">修改密码</div>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="新密码（至少 8 位）"
          className="w-full bg-transparent border border-border/40 rounded-md px-3 py-2 text-sm" />
        <button onClick={update} disabled={busy} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs disabled:opacity-50">
          {busy ? "保存中…" : "更新密码"}
        </button>
      </section>
    </div>
  );
}
