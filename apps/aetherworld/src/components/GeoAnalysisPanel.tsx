import type { GeoFactorResult } from "@/lib/geoFactor";
import { GEO_FACTOR_LABELS } from "@/constants/geoFactors";

export function GeoAnalysisPanel({ result }: { result: GeoFactorResult }) {
  return (
    <div className="aether-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Geo-Factor</div>
          <div className="font-display text-xl gold-text mt-1">{result.preset.name} · {result.preset.en}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl gold-text">{result.score}</div>
          <div className="text-[10px] text-muted-foreground">地理适配</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {(Object.keys(result.preset.scores) as Array<keyof typeof result.preset.scores>).map((k) => {
          const v = result.preset.scores[k];
          return (
            <div key={k} className="rounded-md bg-muted/20 p-2">
              <div className="text-[10px] text-muted-foreground">{GEO_FACTOR_LABELS[k]}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="font-mono text-sm w-8">{v}</div>
                <div className="flex-1 h-1 bg-muted/40 rounded-full overflow-hidden">
                  <div className="h-full" style={{ width: `${v}%`, background: "var(--gold)" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-muted/10 p-3">
          <div className="text-[10px] text-muted-foreground tracking-wider">优势</div>
          <ul className="mt-1 list-disc list-inside text-muted-foreground space-y-0.5">
            {result.highlights.map((h) => <li key={h}>{h}</li>)}
          </ul>
        </div>
        <div className="rounded-md bg-muted/10 p-3">
          <div className="text-[10px] text-muted-foreground tracking-wider">阻力</div>
          <ul className="mt-1 list-disc list-inside text-muted-foreground space-y-0.5">
            {result.resistance.map((h) => <li key={h}>{h}</li>)}
          </ul>
        </div>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <div><span className="text-primary/80">最适合行动：</span>{result.bestAction}</div>
        <div><span className="text-primary/80">最适合产品：</span>{result.bestProduct}</div>
        <div><span className="text-primary/80">迁移建议：</span>{result.migrationAdvice}</div>
      </div>
    </div>
  );
}
