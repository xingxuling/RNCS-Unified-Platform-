import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signUpEmail, signInWithGoogle } from "@/lib/auth/authActions";
import { emailSchema, passwordSchema, displayNameSchema } from "@/lib/auth/authSchemas";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "注册 · Aetherworld" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const nav = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dn = displayNameSchema.safeParse(displayName);
    const em = emailSchema.safeParse(email);
    const pw = passwordSchema.safeParse(password);
    if (!dn.success) return toast.error(dn.error.issues[0].message);
    if (!em.success) return toast.error(em.error.issues[0].message);
    if (!pw.success) return toast.error(pw.error.issues[0].message);
    if (password !== confirm) return toast.error("两次输入的密码不一致");
    setBusy(true);
    const { error } = await signUpEmail({ email, password, displayName });
    setBusy(false);
    if (error) return toast.error("注册失败：" + error.message);
    toast.success("账户已创建");
    nav({ to: "/" });
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4 py-8">
      <div className="aether-card w-full max-w-md p-6 md:p-8 space-y-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Aetherworld</div>
          <h1 className="text-2xl font-display mt-1">创建账户</h1>
          <p className="text-xs text-muted-foreground mt-1">注册后将自动创建「我的工作区」。</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="显示名称" value={displayName} onChange={setDisplayName} />
          <Field label="邮箱" type="email" value={email} onChange={setEmail} />
          <Field label="密码" type="password" value={password} onChange={setPassword} />
          <Field label="确认密码" type="password" value={confirm} onChange={setConfirm} />
          <button disabled={busy} className="w-full py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50">
            {busy ? "创建中…" : "创建账户"}
          </button>
        </form>
        <button onClick={() => signInWithGoogle()} className="w-full py-2 rounded-md border border-border/40 text-sm">
          使用 Google 注册
        </button>
        <div className="text-xs text-muted-foreground text-center">
          已有账户？<Link to="/login" className="text-foreground underline underline-offset-2">登录</Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent border border-border/40 rounded-md px-3 py-2 text-sm" />
    </div>
  );
}
