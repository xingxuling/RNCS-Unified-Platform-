import { useSyncExternalStore } from "react";
import { getInstalled, getManifest, enablePackage, disablePackage, uninstallPackage, subscribeStore } from "@/lib/webxxm-store/webXXMPackageRegistry";
import { toast } from "sonner";

export function WebXXMPackageDependencyPanel({ packageId }: { packageId: string }) {
  useSyncExternalStore((cb) => subscribeStore(cb), () => 0, () => 0);
  const m = getManifest(packageId);
  const inst = getInstalled(packageId);
  if (!m) return null;
  const act = (fn: () => any, label: string) => () => { const r = fn(); r.ok ? toast.success(`${label} 成功`) : toast.error(`${label} 失败`); };
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="text-sm">{m.chineseName} 设置</div>
      <div className="text-[11px] text-muted-foreground">当前状态：{m.status.status}{inst ? `（enabled=${inst.enabled}）` : "（未安装）"}</div>
      <div className="flex gap-2 text-[11px]">
        <button onClick={act(() => enablePackage(packageId), "启用")} className="px-2.5 py-1 rounded border border-border/60">启用</button>
        <button onClick={act(() => disablePackage(packageId), "禁用")} className="px-2.5 py-1 rounded border border-border/60">禁用</button>
        <button onClick={act(() => uninstallPackage(packageId), "卸载")} className="px-2.5 py-1 rounded border border-red-500/60 text-red-400">卸载</button>
      </div>
    </div>
  );
}
