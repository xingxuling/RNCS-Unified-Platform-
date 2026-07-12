import type { ReboundResult } from "@/lib/pressureRebound";

export function ReboundGauge({ result, label }: { result: ReboundResult; label?: string }) {
  const color =
    result.level === "Imminent" ? "var(--destructive)" :
    result.level === "Near-Burst" ? "var(--trigger-peak)" :
    result.level === "Building" ? "var(--trigger-high)" : "var(--trigger-mid)";
  return (
    <div className="aether-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Pressure Rebound</div>
          <div className="font-display text-lg gold-text mt-1">{label ?? "反冲压力"}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl" style={{ color }}>{result.index}</div>
          <div className="text-[10px] text-muted-foreground tracking-wider">{result.level}</div>
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted/40 overflow-hidden">
        <div className="h-full" style={{ width: `${result.index}%`, background: color, boxShadow: `0 0 12px ${color}` }} />
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{result.advice}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {result.burstForms.map((f) => (
          <span key={f} className="text-[10px] px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">{f}</span>
        ))}
      </div>
    </div>
  );
}
