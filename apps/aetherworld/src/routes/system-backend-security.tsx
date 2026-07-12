import { createFileRoute, Link } from "@tanstack/react-router";
import { BACKEND_TABLES, BACKEND_CHECKS, MANUAL_TODO, NEXT_ROUND } from "@/lib/system/backendSecurityClosureReport";

export const Route = createFileRoute("/system-backend-security")({
  head: () => ({ meta: [{ title: "后端安全闭环报告 · Aetherworld" }] }),
  component: BackendSecurityPage,
});

const STATUS_TEXT: Record<string, string> = {
  DONE: "已完成",
  READY_PENDING_CONFIG: "就绪 / 待启用",
  PARTIAL: "部分完成",
  MANUAL_REQUIRED: "需人工处理",
};

function StatusBadge({ s }: { s: string }) {
  const color =
    s === "DONE" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
    : s === "READY_PENDING_CONFIG" ? "bg-sky-500/10 text-sky-600 border-sky-500/30"
    : s === "PARTIAL" ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
    : "bg-rose-500/10 text-rose-600 border-rose-500/30";
  return (
    <span className={`inline-flex items-center px-2 h-5 rounded text-[11px] border ${color}`}>{STATUS_TEXT[s] || s}</span>
  );
}

function BackendSecurityPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <p className="text-xs text-muted-foreground">P0.5 · 系统报告</p>
        <h1 className="text-2xl font-semibold">后端安全闭环报告</h1>
        <p className="text-sm text-muted-foreground">
          本轮把已经在前端落地的安全边界（Secret 脱敏、Full60 / Founder-only / Workspace Dump 过滤、社交发布闸）推进到云端表结构与 RLS 策略，并新增后端二次校验入口。
        </p>
        <div className="flex gap-2 text-xs">
          <Link to="/system-bug-audit" className="underline text-muted-foreground hover:text-foreground">返回 Bug 检查</Link>
          <Link to="/social/audit" className="underline text-muted-foreground hover:text-foreground">社交审计</Link>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">一、云端表结构</h2>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">表名</th>
                <th className="text-left px-3 py-2">RLS</th>
                <th className="text-left px-3 py-2">策略</th>
                <th className="text-left px-3 py-2">状态</th>
                <th className="text-left px-3 py-2">说明</th>
              </tr>
            </thead>
            <tbody>
              {BACKEND_TABLES.map((t) => (
                <tr key={t.table} className="border-t border-border align-top">
                  <td className="px-3 py-2 font-mono text-xs">{t.table}</td>
                  <td className="px-3 py-2 text-xs">{t.rlsEnabled ? "已启用" : "未启用"}</td>
                  <td className="px-3 py-2 text-xs">{t.policies.join(" / ")}</td>
                  <td className="px-3 py-2"><StatusBadge s={t.status} /></td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">二、安全闭环检查项</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BACKEND_CHECKS.map((c) => (
            <div key={c.id} className="rounded-md border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{c.area} · {c.id}</div>
                <div className="flex gap-1">
                  <StatusBadge s={c.frontend} />
                  <StatusBadge s={c.backend} />
                </div>
              </div>
              <div className="text-sm font-medium">{c.title}</div>
              <p className="text-xs text-muted-foreground">{c.note}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">徽标顺序：前端 / 后端。</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">三、仍需人工确认</h2>
        <ul className="space-y-1 text-sm">
          {MANUAL_TODO.map((t, i) => (
            <li key={i} className="rounded-md border border-border px-3 py-2 text-xs">• {t}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">四、下一轮建议</h2>
        <ul className="space-y-1 text-sm">
          {NEXT_ROUND.map((t, i) => (
            <li key={i} className="rounded-md border border-border px-3 py-2 text-xs">• {t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
