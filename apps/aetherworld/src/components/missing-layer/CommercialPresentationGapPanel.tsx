import type { CommercialPresentationGapResult } from "@/lib/missing-layer/commercialPresentationGapDetector";

export function CommercialPresentationGapPanel({ r }: { r: CommercialPresentationGapResult }) {
  return (
    <div className="aether-card p-3 text-xs space-y-1">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">商业展示缺口</div>
      <div>评分 {r.presentationGapScore}</div>
      <div className="text-muted-foreground">缺：{[...r.missingDemoFlows, ...r.missingPitchPages].slice(0, 4).join("、")}</div>
    </div>
  );
}
