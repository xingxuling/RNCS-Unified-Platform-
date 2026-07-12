import type { DomainScore } from "@/lib/creationFeasibilityEngine";

export function CreationFeasibilityRadar({ scores, viability, levelName }: {
  scores: DomainScore[]; viability: number; levelName: string;
}) {
  return (
    <div className="aether-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Viability · 虚拟创造物可行度</div>
        <div className="text-2xl font-display gold-text">{viability}</div>
      </div>
      <div className="text-xs text-foreground/80">等级：{levelName}</div>
      <div className="h-2 rounded bg-background/40 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary/60 to-amber-400/80" style={{ width: `${viability}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {scores.map(s => (
          <div key={s.domainId} className="text-[11px] flex items-center gap-2">
            <div className="w-24 shrink-0 text-muted-foreground truncate">{s.domainName}</div>
            <div className="flex-1 h-1.5 rounded bg-background/40 overflow-hidden">
              <div className="h-full bg-primary/60" style={{ width: `${s.score}%` }} />
            </div>
            <div className="w-10 text-right">{s.score}</div>
            <div className="w-10 text-right text-muted-foreground">×{s.weight.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
