import { useSyncExternalStore, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getManifest, installPackage, downloadPackage, subscribeStore } from "@/lib/webxxm-store/webXXMPackageRegistry";
import { checkCompatibility, evaluatePackageSafety, runPackageQa } from "@/lib/webxxm-store/webXXMPackageSafetyGuard";
import { toast } from "sonner";

export function WebXXMInstallPanel({ packageId }: { packageId: string }) {
  useSyncExternalStore((cb) => subscribeStore(cb), () => 0, () => 0);
  const m = getManifest(packageId);
  const [autoEnable, setAutoEnable] = useState(true);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (!m) return <div className="aether-card p-6 text-sm text-muted-foreground">未找到能力包 {packageId}。</div>;
  const compat = checkCompatibility(m);
  const safety = evaluatePackageSafety(m);
  const qa = runPackageQa(m);
  const blocked = safety.status === "BLOCKED" || compat.status === "FAIL";

  const onInstall = () => {
    if (blocked) { toast.error("不可安装", { description: "安全或兼容性检查未通过。" }); return; }
    setBusy(true);
    // 严格生命周期：先确保已下载
    if (m.status.status === "AVAILABLE" || m.status.status === "UNINSTALLED") {
      const d = downloadPackage(packageId);
      if (!d.ok) { setBusy(false); toast.error("下载失败", { description: d.reason }); return; }
    }
    const r = installPackage(packageId, { autoEnable });
    setBusy(false);
    if (r.ok) {
      toast.success(autoEnable ? `安装并启用成功 · ${m.chineseName}` : `安装成功，请记得启用 · ${m.chineseName}`);
      navigate({ to: "/webxxm-package/$id", params: { id: packageId } });
    } else {
      toast.error("安装失败", { description: r.reason });
    }
  };

  return (
    <div className="space-y-4">
      <div className="aether-card p-4">
        <div className="text-lg font-display">安装 {m.chineseName}</div>
        <div className="text-xs text-muted-foreground">{m.name} · v{m.version} · {m.installSize}</div>
        <p className="text-sm mt-2">{m.description}</p>
      </div>

      <Summary title="将提供的对象" items={m.providedObjects} />
      <Summary title="将注册的命令" items={m.providedCommands} />
      <Summary title="将开放的路由" items={m.providedRoutes} />
      <Summary title="依赖的系统" items={m.dependencies.map((d) => `${d.type} · ${d.dependencyId}`)} />
      <Summary title="权限" items={m.permissions.map((p) => `[${p.riskLevel}] ${p.name} — ${p.description}`)} />

      <div className="aether-card p-4 space-y-2 text-xs">
        <CheckLine label="兼容性" status={compat.status} />
        <CheckLine label="安全" status={safety.status} />
        <CheckLine label="QA" status={qa.status} />
      </div>

      <div className="aether-card p-4 flex items-center justify-between">
        <label className="text-xs flex items-center gap-2">
          <input type="checkbox" checked={autoEnable} onChange={(e) => setAutoEnable(e.target.checked)} />
          安装后立即启用
        </label>
        <button
          onClick={onInstall}
          disabled={busy || blocked}
          className="text-sm px-4 py-1.5 rounded bg-foreground text-background disabled:opacity-40"
        >
          {blocked ? "不可安装" : busy ? "安装中…" : "Install"}
        </button>
      </div>
    </div>
  );
}

function Summary({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="aether-card p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">{title}</div>
      {items.length === 0 ? <div className="text-xs text-muted-foreground">—</div> :
        <ul className="text-xs space-y-1">{items.map((s) => <li key={s}>· {s}</li>)}</ul>}
    </div>
  );
}
function CheckLine({ label, status }: { label: string; status: string }) {
  const tone = status === "PASS" ? "text-emerald-400"
    : status === "WARN" ? "text-amber-400"
    : status === "BLOCKED" ? "text-red-500"
    : "text-red-400";
  return <div className="flex justify-between"><span>{label}</span><span className={tone}>{status}</span></div>;
}
