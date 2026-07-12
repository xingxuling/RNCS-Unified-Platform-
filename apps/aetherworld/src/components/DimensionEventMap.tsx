import { PREDICTION_DIMENSIONS } from "@/constants/predictionDimensions";
import { getEventsByDimension } from "@/constants/eventAlgorithmTypes";

export function DimensionEventMap() {
  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Dimension × Event Map · 维度 × 事件
      </div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        {PREDICTION_DIMENSIONS.map((dim) => {
          const events = getEventsByDimension(dim.id);
          return (
            <div key={dim.id} className="rounded-md border border-border bg-secondary/15 p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{dim.icon}</span>
                <div className="font-display text-sm">{dim.name}</div>
                <span className="text-[10px] text-muted-foreground">{dim.en}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{dim.description}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {events.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground">默认事件：{dim.defaultEventTypes.join(" / ")}</span>
                ) : events.map((e) => (
                  <span
                    key={e.id}
                    className="px-1.5 py-0.5 rounded text-[10px] border border-border bg-background/40"
                  >
                    {e.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
