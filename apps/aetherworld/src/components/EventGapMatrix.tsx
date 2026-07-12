import type { GapAnalysisResult } from "@/lib/eventGapAnalyzer";

const STATUS_TONE: Record<string, string> = {
  OK: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  WEAK: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  MISSING: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  OVERFLOW: "text-sky-400 border-sky-500/30 bg-sky-500/10",
};

const STATUS_LABEL: Record<string, string> = {
  OK: "达标",
  WEAK: "偏弱",
  MISSING: "缺失",
  OVERFLOW: "过多",
};

export function EventGapMatrix({ gap }: { gap: GapAnalysisResult }) {
  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Dimension Gap Matrix · 维度缺口（15 大目标维度）
      </div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {gap.coverage.map((c) => (
          <div key={c.targetId} className="rounded-md border border-border bg-secondary/15 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-sm">{c.name}</div>
                <div className="text-[10px] text-muted-foreground">{c.en}</div>
              </div>
              <span className={`px-2 py-0.5 text-[10px] rounded border ${STATUS_TONE[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
            </div>
            <div className="mt-2 text-xs">
              当前 <span className="font-mono">{c.currentCount}</span>
              <span className="text-muted-foreground"> / 目标 {c.minCount}–{c.maxCount}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{c.recommendation}</div>
            {c.mappedFromExisting.length > 0 && (
              <div className="text-[10px] text-muted-foreground mt-1">
                映射自：{c.mappedFromExisting.join(" / ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
