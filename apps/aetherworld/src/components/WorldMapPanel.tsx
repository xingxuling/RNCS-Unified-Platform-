import type { WorldZone } from "@/lib/worldMapGenerationEngine";

const STATE_STYLE: Record<string, string> = {
  OPEN: "border-emerald-500/40 text-emerald-300",
  FORMING: "border-sky-500/40 text-sky-300",
  LOCKED: "border-zinc-500/40 text-zinc-400",
  OVERLOADED: "border-orange-500/40 text-orange-300",
  HIDDEN: "border-purple-500/40 text-purple-300",
  DANGEROUS: "border-rose-500/50 text-rose-300",
};
const STATE_LABEL: Record<string, string> = {
  OPEN: "开放", FORMING: "成形", LOCKED: "锁定", OVERLOADED: "过载", HIDDEN: "隐藏", DANGEROUS: "危险",
};

export function WorldMapPanel({ zones }: { zones: WorldZone[] }) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">World Map · 世界地图</div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
        {zones.map(z => (
          <div key={z.id} className={`aether-card p-3 border ${STATE_STYLE[z.state]} hover:scale-[1.02] transition`}>
            <div className="text-[10px] uppercase tracking-wider opacity-70">{z.enName}</div>
            <div className="text-sm font-medium mt-0.5">{z.zoneName}</div>
            <div className="mt-1 text-[10px] flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-background/60">{STATE_LABEL[z.state]}</span>
              <span className="text-muted-foreground">LV {z.level}</span>
              <span className="text-muted-foreground">任务 {z.currentQuestIds.length}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-snug">{z.description}</p>
            {z.recommendedActions.length > 0 && (
              <div className="text-[10px] text-primary/80 mt-2">建议：{z.recommendedActions.join(" / ")}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
