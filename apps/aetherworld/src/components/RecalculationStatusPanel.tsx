import { useMemo } from "react";
import { useAetherData } from "@/lib/useAetherData";
import { getSnapshot } from "@/lib/globalRecalculationEngine";
import { RECALC_STATUS_META } from "@/constants/recalculationStatus";
import { RECALC_MODULES } from "@/constants/recalculationScopes";

export function RecalculationStatusPanel() {
  const { active, feedback } = useAetherData();
  const snap = useMemo(() => getSnapshot(), [active, feedback]);
  const meta = RECALC_STATUS_META[snap.overall];

  const toneClass =
    meta.tone === "ok" ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300" :
    meta.tone === "warn" ? "border-amber-500/40 bg-amber-500/5 text-amber-300" :
    meta.tone === "danger" ? "border-destructive/40 bg-destructive/5 text-destructive" :
    "border-primary/40 bg-primary/5 text-primary";

  return (
    <div className="aether-card p-6 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Recalculation Health · 重算健康状态
          </div>
          <h2 className="font-display text-lg mt-0.5">总重算完整度</h2>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground">Integrity</div>
          <div className={`font-display text-3xl ${snap.integrity === 100 ? "gold-text" : "text-foreground"}`}>
            {snap.integrity}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">/ 100</div>
        </div>
      </div>

      <div className={`rounded-md border p-3 text-xs leading-relaxed ${toneClass}`}>
        <div className="font-display">{meta.cn} · {meta.en}</div>
        <div className="text-muted-foreground mt-1">{meta.description}</div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <Cell label="模块总数" value={snap.totalCount} />
        <Cell label="过期模块" value={snap.staleCount} accent={snap.staleCount > 0} />
        <Cell label="最近重算"
          value={snap.latestLog?.completedAt
            ? new Date(snap.latestLog.completedAt).toLocaleString("zh-CN", { hour12: false })
            : "—"}
        />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          模块状态
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {(Object.keys(snap.modules) as (keyof typeof snap.modules)[]).map((id) => {
            const m = snap.modules[id];
            const mm = RECALC_MODULES[id];
            const isStale = m.status === "stale";
            return (
              <div
                key={id}
                className={`flex items-center justify-between rounded-md border p-2 text-xs ${
                  isStale
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-border bg-secondary/10"
                }`}
              >
                <div>
                  <div className="font-display">{mm.cn}</div>
                  <div className="text-[10px] text-muted-foreground">{mm.en}</div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    isStale
                      ? "border-amber-500/40 text-amber-300"
                      : "border-emerald-500/40 text-emerald-300"
                  }`}>
                    {isStale ? "过期" : "最新"}
                  </span>
                  {m.lastRecalculatedAt && !isStale && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                      {new Date(m.lastRecalculatedAt).toLocaleTimeString("zh-CN", { hour12: false })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${accent ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-secondary/10"}`}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display text-lg mt-0.5 ${accent ? "text-amber-300" : ""}`}>{value}</div>
    </div>
  );
}
