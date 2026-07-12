import { listVersionDependencies } from "@/lib/version-leap/versionDependencyGraph";

const STATUS_COLOR: Record<string, string> = {
  DONE: "text-emerald-600", PENDING: "text-amber-600", FAILED: "text-rose-600", SKIPPED: "text-muted-foreground",
};

export function VersionDependencyGraphPanel() {
  const deps = listVersionDependencies();
  return (
    <div className="space-y-2">
      {deps.map((d, i) => (
        <div key={i} className="border border-border/40 rounded-md p-3 bg-muted/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{d.sourceChange}</span>
            <span className={`text-xs ${STATUS_COLOR[d.updateStatus]}`}>{d.updateStatus}</span>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">影响系统</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {d.affectedSystems.map((s) => (
                  <span key={s} className="text-[11px] px-1.5 py-0.5 rounded bg-muted">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">所需更新</p>
              <ul className="text-xs mt-1 space-y-0.5 list-disc list-inside">
                {d.requiredUpdates.map((u) => <li key={u}>{u}</li>)}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
