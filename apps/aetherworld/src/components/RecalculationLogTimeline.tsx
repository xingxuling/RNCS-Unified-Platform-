import { useMemo } from "react";
import { useAetherData } from "@/lib/useAetherData";
import { loadLogs } from "@/lib/globalRecalculationEngine";
import { RECALC_STATUS_META } from "@/constants/recalculationStatus";
import { RECALCULATION_TRIGGERS } from "@/constants/recalculationTriggers";
import { SCOPE_META, RECALC_MODULES } from "@/constants/recalculationScopes";

export function RecalculationLogTimeline() {
  const { active, feedback } = useAetherData();
  const logs = useMemo(() => loadLogs(), [active, feedback]);

  return (
    <div className="aether-card p-6 space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Recalculation Logs · 重算日志
        </div>
        <h2 className="font-display text-lg mt-0.5">最近 {logs.length} 次重算</h2>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          暂无重算记录。执行任一重算后将自动记录到本地（不上传）。
        </p>
      ) : (
        <ol className="space-y-3">
          {logs.slice(0, 20).map((log) => {
            const tone = RECALC_STATUS_META[log.status].tone;
            const dot =
              tone === "ok" ? "bg-emerald-400" :
              tone === "warn" ? "bg-amber-400" :
              tone === "danger" ? "bg-destructive" : "bg-primary";
            return (
              <li key={log.id} className="rounded-md border border-border bg-secondary/10 p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="font-display text-sm">
                    {RECALCULATION_TRIGGERS[log.triggeredBy].cn}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {SCOPE_META[log.scope].cn} · {SCOPE_META[log.scope].en}
                  </span>
                  <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                    {new Date(log.startedAt).toLocaleString("zh-CN", { hour12: false })}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {log.beforeSummary}
                  {log.afterSummary && <> → {log.afterSummary}</>}
                </div>
                {log.affectedModules.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {log.affectedModules.slice(0, 8).map((m) => (
                      <span key={m} className="text-[10px] px-1.5 py-0.5 rounded border border-border">
                        {RECALC_MODULES[m].cn}
                      </span>
                    ))}
                    {log.affectedModules.length > 8 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{log.affectedModules.length - 8}
                      </span>
                    )}
                  </div>
                )}
                {log.warnings.length > 0 && (
                  <div className="text-[11px] text-amber-300 mt-2">
                    ⚠ {log.warnings.join("；")}
                  </div>
                )}
                {log.errors.length > 0 && (
                  <div className="text-[11px] text-destructive mt-2">
                    × {log.errors.join("；")}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
