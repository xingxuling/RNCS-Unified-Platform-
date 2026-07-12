import { useState, useSyncExternalStore } from "react";
import { listManifests, subscribeStore } from "@/lib/webxxm-store/webXXMPackageRegistry";
import { WebXXMPackageCard } from "./WebXXMPackageCard";
import { WebXXMStoreSafetyNote } from "./WebXXMStoreSafetyNote";

const FILTERS = [
  { id: "ALL",            label: "全部" },
  { id: "NOT_DOWNLOADED", label: "未下载" },
  { id: "DOWNLOADED",     label: "已下载" },
  { id: "INSTALLED",      label: "已安装" },
  { id: "ENABLED",        label: "已启用" },
  { id: "UPDATE",         label: "需要更新" },
  { id: "BLOCKED",        label: "已阻断" },
] as const;

type FilterId = typeof FILTERS[number]["id"];

export function WebXXMStorePanel() {
  const [filter, setFilter] = useState<FilterId>("ALL");
  // re-render on store changes
  useSyncExternalStore(
    (cb) => subscribeStore(cb),
    () => 0,
    () => 0,
  );
  const manifests = listManifests().filter((m) => {
    const s = m.status.status;
    switch (filter) {
      case "ALL":            return true;
      case "NOT_DOWNLOADED": return s === "AVAILABLE" || s === "UNINSTALLED";
      case "DOWNLOADED":     return s === "DOWNLOADED" || s === "DOWNLOADING";
      case "INSTALLED":      return s === "INSTALLED" || s === "INSTALLING" || s === "DISABLED";
      case "ENABLED":        return s === "ENABLED";
      case "UPDATE":         return s === "UPDATE_AVAILABLE";
      case "BLOCKED":        return s === "BLOCKED" || s === "BROKEN";
      default: return true;
    }
  });
  return (
    <div className="space-y-4">
      <WebXXMStoreSafetyNote />
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-[11px] px-2.5 py-1 rounded-full border ${filter === f.id ? "bg-foreground text-background border-foreground" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {manifests.map((m) => <WebXXMPackageCard key={m.packageId} m={m} />)}
        {manifests.length === 0 && (
          <div className="aether-card p-6 text-xs text-muted-foreground text-center col-span-full">该筛选下暂无能力包。</div>
        )}
      </div>
    </div>
  );
}
