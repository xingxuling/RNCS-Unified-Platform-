import type { ObjectLayerGapResult } from "@/lib/missing-layer/objectLayerGapDetector";

export function ObjectLayerGapPanel({ r }: { r: ObjectLayerGapResult }) {
  return (
    <div className="aether-card p-3 text-xs space-y-1">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">对象层缺口</div>
      <div>评分 {r.objectGapScore}</div>
      {r.outputsNotObjectized.length > 0 && <div className="text-muted-foreground">未对象化：{r.outputsNotObjectized.join(", ")}</div>}
    </div>
  );
}
