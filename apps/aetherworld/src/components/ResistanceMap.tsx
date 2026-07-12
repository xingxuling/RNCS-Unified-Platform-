import type { ResistanceReductionResult } from "@/lib/resistanceReductionEngine";

export function ResistanceMap({ data }: { data: ResistanceReductionResult }) {
  return (
    <section className="aether-card-elevated p-5 space-y-3">
      <h3 className="font-display text-base gold-text">阻力图 · Resistance Map</h3>
      {data.topResistances.length === 0 ? (
        <div className="text-xs text-muted-foreground">未检测到显著阻力。</div>
      ) : (
        <ul className="space-y-2">
          {data.topResistances.map((r) => (
            <li key={r.resistance.id} className="text-sm">
              <div className="flex items-center justify-between">
                <span>{r.resistance.userFriendlyName}</span>
                <span className="text-[10px] text-muted-foreground">{Math.round(r.intensity * 100)}%</span>
              </div>
              <div className="h-1 rounded bg-border/50 overflow-hidden mt-1">
                <div className="h-full bg-primary" style={{ width: `${r.intensity * 100}%` }} />
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{r.reason} · {r.resistance.description}</div>
            </li>
          ))}
        </ul>
      )}
      <div className="text-xs border-t border-border/60 pt-2">
        <div className="text-muted-foreground mb-1">削减计划</div>
        <ul className="list-disc list-inside space-y-0.5">
          {data.reductionPlan.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>
      <div className="text-[11px] text-muted-foreground">残余噪声估计：{Math.round(data.remainingNoise * 100)}%</div>
    </section>
  );
}
