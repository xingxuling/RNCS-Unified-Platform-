import type { ReusePotentialScore } from "@/lib/missing-layer/reusePotentialScorer";

export function ReusePotentialPanel({ score }: { score: ReusePotentialScore }) {
  return (
    <div className="aether-card p-3 text-xs space-y-1">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">复用潜力</div>
      <div className="flex items-center justify-between">
        <span>评分 {score.score}</span>
        <span className="text-primary/80">{score.level}</span>
      </div>
      <div className="text-muted-foreground">{score.reason}</div>
    </div>
  );
}
