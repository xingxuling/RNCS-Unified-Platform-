import { createFileRoute, Link } from "@tanstack/react-router";
import {
  SYSTEM_ROUTE_REGISTRY,
  buildCompletenessReport,
  type SystemRouteStatus,
} from "@/lib/system/systemPageCompletenessReport";

const STATUS_STYLE: Record<SystemRouteStatus, { label: string; cls: string }> = {
  READY:        { label: "可用",         cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  PLACEHOLDER:  { label: "开发中",       cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  RUNTIME_ONLY: { label: "后端就绪",     cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  PAGE_MISSING: { label: "页面缺失",     cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  BROKEN:       { label: "修复中",       cls: "bg-rose-600/15 text-rose-200 border-rose-600/40" },
  HIDDEN:       { label: "已隐藏",       cls: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
};

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-md border border-border bg-card/40 px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}

function PageCompletenessPage() {
  const report = buildCompletenessReport();
  const visible = SYSTEM_ROUTE_REGISTRY.filter(
    (i) => i.status !== "HIDDEN" && i.status !== "PAGE_MISSING",
  );
  const hidden = SYSTEM_ROUTE_REGISTRY.filter(
    (i) => i.status === "HIDDEN" || i.status === "PAGE_MISSING",
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">System Audit</div>
        <h1 className="text-2xl font-semibold">系统页面完整性</h1>
        <p className="text-sm text-muted-foreground">
          针对系统总览每个入口的真实实现状态分级（READY / PLACEHOLDER / RUNTIME_ONLY / PAGE_MISSING / BROKEN / HIDDEN）。
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="总入口"    value={report.totalEntries} />
        <Stat label="可用"      value={report.ready}        tone="text-emerald-300" />
        <Stat label="占位"      value={report.placeholder}  tone="text-amber-300" />
        <Stat label="后端就绪"  value={report.runtimeOnly}  tone="text-sky-300" />
        <Stat label="页面缺失"  value={report.pageMissing}  tone="text-rose-300" />
        <Stat label="修复中"    value={report.broken}       tone="text-rose-200" />
        <Stat label="已隐藏"    value={report.hidden}       tone="text-zinc-300" />
        <Stat label="对外展示"  value={report.visibleInOverview} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">系统总览中展示的入口</h2>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">名称</th>
                <th className="px-3 py-2">路径</th>
                <th className="px-3 py-2">分类</th>
                <th className="px-3 py-2">状态</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const style = STATUS_STYLE[item.status];
                return (
                  <tr key={item.id} className="border-t border-border/60">
                    <td className="px-3 py-2">
                      <Link to={item.path} className="text-foreground hover:underline">
                        {item.label}
                      </Link>
                      {item.note ? (
                        <div className="text-xs text-muted-foreground">{item.note}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{item.path}</td>
                    <td className="px-3 py-2 text-xs">{item.category}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${style.cls}`}>
                        {style.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">已隐藏 / 规划中（不在系统总览暴露）</h2>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">名称</th>
                <th className="px-3 py-2">路径</th>
                <th className="px-3 py-2">状态</th>
                <th className="px-3 py-2">说明</th>
              </tr>
            </thead>
            <tbody>
              {hidden.map((item) => {
                const style = STATUS_STYLE[item.status];
                return (
                  <tr key={item.id} className="border-t border-border/60">
                    <td className="px-3 py-2">{item.label}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{item.path}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${style.cls}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{item.note ?? item.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="text-xs text-muted-foreground">
        <Link to="/system" className="underline">返回系统总览</Link>
        <span className="mx-2">·</span>
        <Link to="/system/route-health" className="underline">路由健康报告</Link>
        <span className="mx-2">·</span>
        生成时间：{report.generatedAt}
      </footer>
    </div>
  );
}

export const Route = createFileRoute("/system/page-completeness")({
  head: () => ({ meta: [{ title: "系统页面完整性 · Aetherworld" }] }),
  component: PageCompletenessPage,
});
