import { Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { getManifest, listLifecycle, subscribeStore } from "@/lib/webxxm-store/webXXMPackageRegistry";
import { checkCompatibility, evaluatePackageSafety, runPackageQa } from "@/lib/webxxm-store/webXXMPackageSafetyGuard";
import { WebXXMPackageStatusBadge } from "./WebXXMPackageStatusBadge";

export function WebXXMPackageDetailPanel({ packageId }: { packageId: string }) {
  useSyncExternalStore((cb) => subscribeStore(cb), () => 0, () => 0);
  const m = getManifest(packageId);
  if (!m) return <div className="aether-card p-6 text-sm text-muted-foreground">未找到能力包 {packageId}。</div>;
  const compat = checkCompatibility(m);
  const safety = evaluatePackageSafety(m);
  const qa = runPackageQa(m);
  const lifecycle = listLifecycle(packageId).slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="aether-card p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-lg font-display">{m.chineseName}</div>
            <div className="text-xs text-muted-foreground">{m.name} · v{m.version} · {m.author}</div>
          </div>
          <WebXXMPackageStatusBadge status={m.status.status} />
        </div>
        <p className="text-sm mt-2">{m.description}</p>
        <div className="flex gap-2 mt-3 text-[11px]">
          <Link to="/webxxm-install/$id" params={{ id: packageId }} className="px-2.5 py-1 rounded border border-foreground bg-foreground text-background">前往安装</Link>
          <Link to="/webxxm-package-audit/$id" params={{ id: packageId }} className="px-2.5 py-1 rounded border border-border/60">审计</Link>
          <Link to="/webxxm-package-settings/$id" params={{ id: packageId }} className="px-2.5 py-1 rounded border border-border/60">设置</Link>
        </div>
      </div>

      <Section title="兼容性">{compat.issues.length === 0 ? <P ok>PASS</P> : compat.issues.map((i) => <P key={i.ruleId}>{i.severity}：{i.message}</P>)}</Section>
      <Section title="安全">{safety.issues.length === 0 ? <P ok>PASS</P> : safety.issues.map((i) => <P key={i.ruleId}>{i.severity}：{i.message}</P>)}</Section>
      <Section title="QA">{qa.issues.length === 0 ? <P ok>PASS</P> : qa.issues.map((i) => <P key={i.ruleId}>{i.severity}：{i.message}</P>)}</Section>

      <Section title="依赖">
        <ul className="text-xs space-y-1">
          {m.dependencies.map((d) => (
            <li key={d.dependencyId}>· {d.type} · {d.dependencyId}{d.required ? "（必需）" : "（可选）"}</li>
          ))}
        </ul>
      </Section>

      <Section title="权限">
        <ul className="text-xs space-y-1">
          {m.permissions.map((p) => (
            <li key={p.permissionId}>· [{p.riskLevel}] {p.name} — {p.description}</li>
          ))}
        </ul>
      </Section>

      <Section title="提供内容">
        <div className="text-xs space-y-1">
          <div>对象：{m.providedObjects.join("、") || "—"}</div>
          <div>命令：{m.providedCommands.join("、") || "—"}</div>
          <div>路由：{m.providedRoutes.join("、") || "—"}</div>
          <div>适配运行时：{m.runtimeAdapters.join("、") || "—"}</div>
        </div>
      </Section>

      <Section title="生命周期">
        {lifecycle.length === 0 && <P>暂无记录</P>}
        {lifecycle.map((r) => (
          <div key={r.recordId} className="text-[11px] text-muted-foreground">
            {new Date(r.createdAt).toLocaleString("zh-CN")} · {r.action} → {r.status}{r.reason ? ` · ${r.reason}` : ""}
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="aether-card p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}
function P({ children, ok }: { children: React.ReactNode; ok?: boolean }) {
  return <p className={`text-xs ${ok ? "text-emerald-400" : "text-muted-foreground"}`}>{children}</p>;
}
