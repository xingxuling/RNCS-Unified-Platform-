import { useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { listInstalled, listManifests, subscribeStore } from "@/lib/webxxm-store/webXXMPackageRegistry";
import { WebXXMPackageStatusBadge } from "./WebXXMPackageStatusBadge";

export function WebXXMInstalledPanel() {
  useSyncExternalStore((cb) => subscribeStore(cb), () => 0, () => 0);
  const installed = listInstalled();
  const manifestMap = Object.fromEntries(listManifests().map((m) => [m.packageId, m]));
  if (installed.length === 0) {
    return <div className="aether-card p-6 text-xs text-muted-foreground text-center">尚未安装任何 WebXXM 能力包。</div>;
  }
  return (
    <div className="aether-card divide-y divide-border/40">
      {installed.map((i) => {
        const m = manifestMap[i.packageId];
        return (
          <Link
            key={i.packageId}
            to="/webxxm-package/$id"
            params={{ id: i.packageId }}
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30"
          >
            <div className="min-w-0">
              <div className="text-sm">{m?.chineseName ?? i.capabilityId} <span className="text-muted-foreground text-[11px] ml-1">{m?.name}</span></div>
              <div className="text-[11px] text-muted-foreground">v{i.version} · 命令 {i.providedCommands.length} · 对象 {i.providedObjectTypes.length}</div>
            </div>
            {m && <WebXXMPackageStatusBadge status={m.status.status} />}
          </Link>
        );
      })}
    </div>
  );
}
