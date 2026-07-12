import type { EngineWeightDisplay } from "@/lib/feedbackWeightEngine";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export function EngineWeightMatrix({ data }: { data: EngineWeightDisplay[] }) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Engine Weight Matrix</div>
          <div className="font-display text-lg gold-text mt-1">引擎权重矩阵</div>
          <div className="text-xs text-muted-foreground mt-1">每个引擎在当前主体模型中的实际权重 (归一化到 1.0)。</div>
        </div>
      </div>
      <div className="gold-divider my-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {data.map((e) => {
          const pct = Math.round(e.currentWeight * 100);
          const defPct = Math.round(e.defaultWeight * 100);
          const deltaPct = +(e.delta * 100).toFixed(1);
          const trend =
            deltaPct > 0.2 ? "up" :
            deltaPct < -0.2 ? "down" : "flat";
          return (
            <div key={e.key} className="rounded-md border border-border/60 p-3 bg-secondary/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm">{e.label}</div>
                  <div className="text-[10px] text-muted-foreground tracking-wider">{e.en}</div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <div>
                    <div className="font-mono text-lg gold-text">{pct}%</div>
                    <div className="text-[10px] text-muted-foreground">默认 {defPct}%</div>
                  </div>
                  <DeltaIcon trend={trend} />
                </div>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted/20 overflow-hidden relative">
                {/* default marker */}
                <div className="absolute top-0 bottom-0 w-px bg-muted-foreground/40"
                     style={{ left: `${defPct}%` }} />
                <div
                  className="h-full"
                  style={{
                    width: `${pct}%`,
                    background: trend === "up" ? "var(--trigger-high)" :
                                trend === "down" ? "var(--destructive)" :
                                "var(--primary)",
                    opacity: 0.85,
                  }}
                />
              </div>
              {e.recentDelta !== 0 && (
                <div className={`mt-1.5 text-[10px] font-mono ${e.recentDelta > 0 ? "text-trigger-high" : "text-destructive"}`}>
                  最近调整 {e.recentDelta > 0 ? "+" : ""}{(e.recentDelta * 100).toFixed(2)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeltaIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up")   return <ArrowUpRight className="w-4 h-4 text-trigger-high" />;
  if (trend === "down") return <ArrowDownRight className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}
