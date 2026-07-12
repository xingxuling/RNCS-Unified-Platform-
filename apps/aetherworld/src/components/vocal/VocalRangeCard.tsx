import type { VocalRangeResult } from "@/lib/vocal/vocalRangeEstimator";

export function VocalRangeCard({ data }: { data: VocalRangeResult }) {
  return (
    <div className="aether-card p-4 space-y-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Vocal Range · 音域估算</div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-muted-foreground">舒适音域</div>
          <div className="font-mono">{data.estimatedComfortRange}</div>
        </div>
        <div>
          <div className="text-muted-foreground">风险音域</div>
          <div className="font-mono text-amber-500/90">{data.riskyRange}</div>
        </div>
        <div>
          <div className="text-muted-foreground">推荐 Key</div>
          <div className="font-mono">{data.recommendedSongKey}</div>
        </div>
        <div>
          <div className="text-muted-foreground">移调建议</div>
          <div className="text-[11px]">{data.transposeAdvice}</div>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground pt-1">练唱重点：</div>
      <ul className="text-[11px] space-y-0.5 list-disc list-inside">
        {data.practiceFocus.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
      <div className="text-[10px] text-amber-500/80 pt-1">{data.warning}</div>
    </div>
  );
}
