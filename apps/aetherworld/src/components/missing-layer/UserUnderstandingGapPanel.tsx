import type { UserUnderstandingGapResult } from "@/lib/missing-layer/userUnderstandingGapDetector";

export function UserUnderstandingGapPanel({ r }: { r: UserUnderstandingGapResult }) {
  return (
    <div className="aether-card p-3 text-xs space-y-1">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">用户理解缺口</div>
      <div>评分 {r.understandingGapScore}</div>
      {r.recommendedDocs.length > 0 && <div className="text-muted-foreground">建议补：{r.recommendedDocs.slice(0, 3).join("; ")}</div>}
    </div>
  );
}
