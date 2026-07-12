import type { SelfConsistencyResult } from "@/lib/objectSelfConsistencyEngine";

export function ObjectSelfConsistencyGauge({ result }: { result: SelfConsistencyResult }) {
  const w = Math.max(2, Math.min(100, result.score));
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Self-Consistency · 自洽度</div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-display gold-text">{result.score}</div>
        <div className="text-xs text-muted-foreground">/ 100 · {result.label}（{result.level}）</div>
      </div>
      <div className="h-2 bg-background/60 rounded overflow-hidden">
        <div className="h-full bg-primary/70" style={{ width: `${w}%` }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-muted-foreground mb-1">已自洽部分</div>
          <ul className="list-disc list-inside space-y-0.5">{result.consistentParts.map((s,i)=><li key={i}>{s}</li>)}</ul>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">不自洽部分</div>
          <ul className="list-disc list-inside space-y-0.5">{result.inconsistentParts.map((s,i)=><li key={i}>{s}</li>)}</ul>
        </div>
      </div>
      {result.correctionSuggestion.length > 0 && (
        <div className="text-xs">
          <div className="text-muted-foreground mb-1">校正建议</div>
          <ul className="list-disc list-inside space-y-0.5">{result.correctionSuggestion.map((s,i)=><li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
