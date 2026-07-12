// 路由健康 · /system/route-health
// 静态汇总系统页面可访问性，并指引下一步自动化测试方向。
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ROUTE_HEALTH_ITEMS,
  ROUTE_HEALTH_REPORT,
  routeHealthSummary,
  type RouteHealthItem,
} from "@/lib/system/routeHealth";

export const Route = createFileRoute("/system/route-health")({
  head: () => ({
    meta: [
      { title: "路由健康 — Aetherworld" },
      {
        name: "description",
        content: "Aetherworld 全路由健康检查：菜单链接、路由文件、别名与剩余风险。",
      },
    ],
  }),
  component: RouteHealthPage,
});

function statusBadge(status: RouteHealthItem["status"]) {
  const cls: Record<RouteHealthItem["status"], string> = {
    OK: "text-emerald-500 border-emerald-500/30",
    ALIAS: "text-sky-500 border-sky-500/30",
    PLACEHOLDER: "text-amber-500 border-amber-500/30",
    MISSING: "text-red-500 border-red-500/30",
  };
  const label: Record<RouteHealthItem["status"], string> = {
    OK: "可访问",
    ALIAS: "别名",
    PLACEHOLDER: "占位",
    MISSING: "缺失",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 border rounded ${cls[status]}`}>
      {label[status]}
    </span>
  );
}

function RouteHealthPage() {
  const s = routeHealthSummary();
  const r = ROUTE_HEALTH_REPORT;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Route Health
          </div>
          <h1 className="text-2xl font-display">路由健康</h1>
          <p className="text-sm text-muted-foreground">
            汇总系统菜单 / 验收清单中所有页面的可访问性，标注别名与未自动化的检测能力。
          </p>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Stat label="路由文件总数" value={r.totalRouteFiles} />
          <Stat label="菜单链接" value={r.totalMenuLinks} />
          <Stat label="可访问" value={s.ok} tone="ok" />
          <Stat label="别名" value={s.alias} tone="info" />
          <Stat label="缺失" value={s.missing} tone={s.missing > 0 ? "warn" : "muted"} />
        </section>

        <section className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            页面清单
          </div>
          <div className="aether-card divide-y divide-border/40">
            {ROUTE_HEALTH_ITEMS.map((it) => (
              <div
                key={it.path + it.label}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm flex items-center gap-2">
                    <span>{it.label}</span>
                    {statusBadge(it.status)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
                    {it.path}
                    {it.note ? <span className="ml-2 text-muted-foreground/70">· {it.note}</span> : null}
                  </div>
                </div>
                {it.status === "OK" || it.status === "ALIAS" ? (
                  <Link
                    to={it.path}
                    className="text-[11px] px-2 py-1 border border-border/40 rounded hover:bg-muted/40"
                  >
                    打开
                  </Link>
                ) : (
                  <span className="text-[11px] text-muted-foreground/60">不可访问</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            本轮已修复
          </div>
          <div className="aether-card p-4 space-y-1 text-sm">
            {r.fixedRoutes.length === 0 ? (
              <div className="text-muted-foreground">无</div>
            ) : (
              r.fixedRoutes.map((x, i) => (
                <div key={i} className="text-emerald-500/90">· {x}</div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            剩余风险 / 待自动化
          </div>
          <div className="aether-card p-4 space-y-1 text-sm">
            {r.remainingIssues.map((x, i) => (
              <div key={i} className="text-muted-foreground">· {x}</div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            建议下一步
          </div>
          <div className="aether-card p-4 text-sm text-muted-foreground space-y-1">
            <div>1. 引入 Playwright 真实 e2e，对菜单中的每个路径做最小冒烟点击。</div>
            <div>2. 在 CI 中对 routeTree.gen.ts 变更做 diff 检测，菜单链接出现于报告才允许上线。</div>
            <div>3. 在 ErrorBoundary 上聚合 runtime 异常并按 route 归档，作为本表实时来源。</div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: number;
  tone?: "ok" | "info" | "warn" | "muted";
}) {
  const cls: Record<string, string> = {
    ok: "text-emerald-500",
    info: "text-sky-500",
    warn: "text-amber-500",
    muted: "text-foreground",
  };
  return (
    <div className="aether-card p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className={`text-xl font-display mt-1 ${cls[tone]}`}>{value}</div>
    </div>
  );
}
