// 适配度仪表 + 公式分解
import type { RegionalUXResult } from "@/lib/regionalUserCalculus";
import { Activity } from "lucide-react";

export function RegionalUXPanel({ result }: { result: RegionalUXResult }) {
  const tone =
    result.uxFitScore >= 80 ? "text-trigger-peak" :
    result.uxFitScore >= 60 ? "text-trigger-high" :
    result.uxFitScore >= 40 ? "text-trigger-mid" : "text-trigger-low";

  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">UX Fit Score</div>
          <div className="font-display text-lg gold-text mt-1">{result.region} · 地区体验适配度</div>
          <div className="text-xs text-muted-foreground mt-1 max-w-md">{result.finalUXRecommendation}</div>
        </div>
        <div className="text-right">
          <div className={`font-display text-4xl ${tone}`}>{result.uxFitScore}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</div>
        </div>
      </div>

      <div className="gold-divider my-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {result.breakdown.map((b) => (
          <div key={b.label} className={`rounded-md border p-2.5 ${
            b.weight === "pos" ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"
          }`}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-foreground/85">
                <Activity className={`w-3 h-3 ${b.weight === "pos" ? "text-primary" : "text-destructive"}`} />
                {b.label}
              </span>
              <span className="font-mono">{b.value}</span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-muted/20 overflow-hidden">
              <div className={`h-full rounded-full ${b.weight === "pos" ? "bg-primary/70" : "bg-destructive/70"}`} style={{ width: `${b.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-2">
        <Quote title="Primary User Fear" value={result.primaryUserFear} tone="bad" />
        <Quote title="Primary User Desire" value={result.primaryUserDesire} tone="good" />
      </div>
    </div>
  );
}

function Quote({ title, value, tone }: { title: string; value: string; tone: "good" | "bad" }) {
  const cls = tone === "good"
    ? "border-trigger-high/30 bg-trigger-high/5 text-trigger-high"
    : "border-destructive/30 bg-destructive/5 text-destructive";
  return (
    <div className={`rounded-md border p-3 ${cls}`}>
      <div className="text-[10px] uppercase tracking-widest">{title}</div>
      <div className="mt-1 text-xs text-foreground/85">{value}</div>
    </div>
  );
}
