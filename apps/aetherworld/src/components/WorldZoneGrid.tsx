import type { WorldZone } from "@/lib/worldEventMapGenerator";

const STATE_LABEL: Record<string, { label: string; color: string }> = {
  OPEN:       { label: "开放",   color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/5" },
  FORMING:    { label: "成形中", color: "text-sky-400 border-sky-500/40 bg-sky-500/5" },
  LOCKED:     { label: "锁定",   color: "text-zinc-400 border-zinc-500/40 bg-zinc-500/5" },
  OVERLOADED: { label: "过载",   color: "text-amber-400 border-amber-500/40 bg-amber-500/5" },
  HIDDEN:     { label: "未开启", color: "text-muted-foreground border-border bg-muted/20" },
};

export function WorldZoneGrid({ zones }: { zones: WorldZone[] }) {
  return (
    <div>
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">World Zones · 世界区域</div>
        <h2 className="font-display text-xl">你的世界区域</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {zones.map(z => {
          const s = STATE_LABEL[z.state] ?? STATE_LABEL.HIDDEN;
          return (
            <div key={z.dimensionId} className="aether-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-display text-base">{z.zoneName}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${s.color}`}>{s.label}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{z.explanation}</p>
              {z.recommendedActions.length > 0 && (
                <div className="mt-3 text-[11px] text-foreground/80">
                  建议：{z.recommendedActions.join(" · ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
