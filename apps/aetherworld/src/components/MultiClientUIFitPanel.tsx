import type { UIFitResult } from "@/lib/multiClientUIFitEngine";
import { UI_DENSITY } from "@/constants/uiDensityLevels";

const TONE: Record<string, string> = {
  emerald: "border-emerald-500/40 text-emerald-300 bg-emerald-500/5",
  cyan:    "border-cyan-500/40 text-cyan-300 bg-cyan-500/5",
  amber:   "border-amber-500/40 text-amber-300 bg-amber-500/5",
  orange:  "border-orange-500/40 text-orange-300 bg-orange-500/5",
  rose:    "border-rose-500/40 text-rose-300 bg-rose-500/5",
};

export function MultiClientUIFitPanel({ result }: { result: UIFitResult }) {
  const tone = TONE[result.fitLevelTone] ?? TONE.cyan;
  return (
    <div className="aether-card-elevated p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Multi-Client UI Fit · 多端 UI 适评
          </div>
          <div className="font-display text-lg gold-text mt-1">
            {result.clientProfileCN} × {result.deviceProfileCN}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {result.clientProfile} × {result.deviceProfile}
          </div>
        </div>
        <div className={`text-right rounded-md border px-3 py-2 ${tone}`}>
          <div className="text-[10px] uppercase tracking-widest">UI Fit Score</div>
          <div className="font-display text-2xl">{result.uiFitScore}</div>
          <div className="text-[10px]">{result.fitLevelCN}</div>
        </div>
      </div>

      <div className="gold-divider" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <Stat label="推荐密度" value={`${UI_DENSITY[result.recommendedDensity].cn}`} />
        <Stat label="实际密度" value={`${UI_DENSITY[result.actualDensity].cn}`} />
        <Stat label="安全可见度" value={`${result.safetyVisibilityScore}/100`} />
        <Stat label="回验可达性" value={`${result.feedbackAccessibilityScore}/100`} />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">因子分</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {result.factorScores.map(f => (
            <div key={f.id} className="flex items-center justify-between gap-3 rounded border border-border/60 px-2 py-1.5">
              <span className="text-xs">
                <span className={f.kind === "negative" ? "text-rose-300/80" : "text-foreground/85"}>
                  {f.cn}
                </span>
                <span className="ml-1.5 text-[10px] text-muted-foreground">
                  {f.kind === "negative" ? "（负向）" : ""}
                </span>
              </span>
              <span className="font-mono text-xs text-primary">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">建议</div>
        <ul className="text-xs text-foreground/85 space-y-1">
          {result.recommendations.map((r, i) => (
            <li key={i}>· {r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground mt-0.5">{value}</div>
    </div>
  );
}
