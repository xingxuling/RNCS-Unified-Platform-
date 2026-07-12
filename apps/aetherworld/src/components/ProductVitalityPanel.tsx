import type { ProductVitalityResult } from "@/lib/productVitality";
import { VITALITY_FACTORS, VITALITY_LABEL } from "@/constants/productVitalityFactors";
import type { VitalityScores } from "@/lib/productVitality";

export function ProductVitalityPanel({
  scores, result,
}: { scores: VitalityScores; result: ProductVitalityResult }) {
  const color =
    result.level === "High-Vitality" ? "var(--gold)" :
    result.level === "Active" ? "var(--trigger-peak)" :
    result.level === "Growing" ? "var(--trigger-high)" :
    result.level === "Weak" ? "var(--trigger-mid)" : "var(--muted-foreground)";
  return (
    <div className="aether-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Product Vitality</div>
          <div className="font-display text-xl gold-text mt-1">产品活性 · {VITALITY_LABEL[result.level]}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl" style={{ color }}>{result.score}</div>
          <div className="text-[10px] text-muted-foreground">{result.level}</div>
        </div>
      </div>
      <div className="relative h-2 rounded-full bg-muted/40 overflow-hidden">
        <div className="h-full" style={{ width: `${result.score}%`, background: color, boxShadow: `0 0 12px ${color}` }} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {VITALITY_FACTORS.map((f) => {
          const v = scores[f.key];
          return (
            <div key={f.key} className="rounded-md bg-muted/20 p-2">
              <div className="text-[10px] text-muted-foreground">{f.name}{f.isCost ? " (逆)" : ""}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="font-mono text-sm w-6">{v}</div>
                <div className="flex-1 h-1 bg-muted/40 rounded-full overflow-hidden">
                  <div className="h-full" style={{
                    width: `${v * 10}%`,
                    background: f.isCost ? "var(--destructive)" : "var(--gold)",
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-muted/10 p-3">
          <div className="text-[10px] text-muted-foreground tracking-wider">最大增长</div>
          <div className="mt-1">{result.topGrowth.map(k => VITALITY_FACTORS.find(f=>f.key===k)?.name).join("、")}</div>
        </div>
        <div className="rounded-md bg-muted/10 p-3">
          <div className="text-[10px] text-muted-foreground tracking-wider">最大阻断</div>
          <div className="mt-1">{result.topBlock.map(k => VITALITY_FACTORS.find(f=>f.key===k)?.name).join("、")}</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        {result.nextActions.map((a, i) => <div key={i}>· {a}</div>)}
      </div>
    </div>
  );
}
