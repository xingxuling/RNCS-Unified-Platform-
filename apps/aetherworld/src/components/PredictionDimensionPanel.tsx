import type { DimensionRanking } from "@/lib/predictionDimensionEngine";

export function PredictionDimensionPanel({ ranking }: { ranking: DimensionRanking }) {
  const { primary, secondary, all } = ranking;
  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Prediction Dimensions · 预测维度
      </div>
      <div className="mt-3 flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-[220px] rounded-md border border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{primary.dimension.icon}</span>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-primary/80">主维度</div>
              <div className="font-display text-lg gold-text">
                {primary.dimension.name} · {primary.dimension.en}
              </div>
            </div>
            <div className="ml-auto font-mono text-primary">{primary.dimensionWeight}</div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">{primary.reason}</div>
          <div className="text-xs mt-2">
            建议事件：<span className="text-foreground">{primary.suggestedEvents.join(" · ")}</span>
          </div>
        </div>
        <div className="flex-1 min-w-[220px] grid grid-cols-1 gap-2">
          {secondary.map((s) => (
            <div key={s.dimensionId} className="rounded-md border border-border bg-secondary/20 p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{s.dimension.icon}</span>
                <span className="text-sm">{s.dimension.name}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{s.dimensionWeight}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{s.reason}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 md:grid-cols-8 gap-1">
        {all.slice(0, 16).map((d) => (
          <div
            key={d.dimensionId}
            className="rounded border border-border/60 bg-background/40 px-2 py-1 text-[10px] flex items-center justify-between"
            title={`${d.dimension.name} ${d.dimensionWeight}`}
          >
            <span>{d.dimension.icon}</span>
            <span className="font-mono">{d.dimensionWeight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
