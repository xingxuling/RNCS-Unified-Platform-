import type { RecallAnalysisResult } from "@/lib/pastLifeRecallCalculus";

export function RecallSignalMap({ result }: { result: RecallAnalysisResult }) {
  const color =
    result.recallStrength >= 80 ? "text-amber-400" :
    result.recallStrength >= 60 ? "text-primary" :
    result.recallStrength >= 40 ? "text-foreground" : "text-muted-foreground";

  return (
    <div className="aether-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Recall Strength · 潜意识调用评分</div>
        <div className={`text-2xl font-display ${color}`}>{result.recallStrength}</div>
      </div>
      <div className="h-2 rounded bg-background/40 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary/60 to-amber-400/80" style={{ width: `${result.recallStrength}%` }} />
      </div>
      <div className="text-xs text-foreground/80">分段：{result.band}</div>
      <div className="grid grid-cols-3 gap-3 text-[11px] text-muted-foreground pt-2">
        <Stat label="创作价值" value={result.creativeValue} />
        <Stat label="人生模式相关度" value={result.lifePatternRelevance} />
        <Stat label="行动风险" value={result.actionRisk} />
      </div>
      <div className="text-[11px] text-muted-foreground pt-1">
        污染风险：<span className={
          result.contaminationRisk === "HIGH" ? "text-amber-400" :
          result.contaminationRisk === "MEDIUM" ? "text-yellow-300" : "text-emerald-300"}>
          {result.contaminationRisk}
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="aether-card p-2">
      <div>{label}</div>
      <div className="text-foreground text-sm">{value}</div>
    </div>
  );
}
