import type { GovernanceGapResult } from "@/lib/missing-layer/governanceGapDetector";

export function GovernanceGapPanel({ r }: { r: GovernanceGapResult }) {
  return (
    <div className="aether-card p-3 text-xs space-y-1">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">治理缺口</div>
      <div>评分 {r.governanceGapScore}</div>
      {r.riskNotes.length > 0 && <div className="text-amber-400">{r.riskNotes.join("; ")}</div>}
    </div>
  );
}
