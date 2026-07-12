import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { signInEmail, signInWithGoogle } from "@/lib/auth/authActions";
import { emailSchema, passwordSchema } from "@/lib/auth/authSchemas";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "登录 · Aetherworld" }] }),
  validateSearch: (s): { redirect?: string } => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const search = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = emailSchema.safeParse(email);
    const pw = passwordSchema.safeParse(password);
    if (!em.success) return toast.error(em.error.issues[0].message);
    if (!pw.success) return toast.error(pw.error.issues[0].message);
    setBusy(true);
    const { error } = await signInEmail({ email, password });
    setBusy(false);
    if (error) return toast.error("登录失败：" + error.message);
    toast.success("已登录");
    nav({ to: (search.redirect as any) || "/" });
  };

  const google = async () => {
    setBusy(true);
    const r = await signInWithGoogle();
    setBusy(false);
    if (r?.error) toast.error("Google 登录失败");
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4 py-8">
      <div className="aether-card w-full max-w-md p-6 md:p-8 space-y-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Aetherworld</div>
          <h1 className="text-2xl font-display mt-1">登录 Aetherworld</h1>
          <p className="text-xs text-muted-foreground mt-1">使用邮箱或第三方账号继续。</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">邮箱</label>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-transparent border border-border/40 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">密码</label>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-transparent border border-border/40 rounded-md px-3 py-2 text-sm" />
          </div>
          <button disabled={busy} className="w-full py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50">
            {busy ? "登录中…" : "登录"}
          </button>
        </form>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex-1 h-px bg-border/40" /> 或 <span className="flex-1 h-px bg-border/40" />
        </div>
        <button onClick={google} disabled={busy} className="w-full py-2 rounded-md border border-border/40 text-sm">
          使用 Google 登录
        </button>
        <div className="text-xs text-muted-foreground text-center">
          还没有账户？<Link to="/register" className="text-foreground underline underline-offset-2">注册</Link>
        </div>
      </div>
    </div>
  );
}
