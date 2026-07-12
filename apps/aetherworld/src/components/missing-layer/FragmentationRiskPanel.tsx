import type { FeatureFragmentationResult } from "@/lib/missing-layer/featureFragmentationDetector";

export function FragmentationRiskPanel({ r }: { r: FeatureFragmentationResult }) {
  return (
    <div className="aether-card p-3 text-xs space-y-1">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">功能碎片化</div>
      <div>评分 {r.fragmentationScore}</div>
      {r.isolatedModules.length > 0 && <div className="text-muted-foreground">孤立：{r.isolatedModules.join(", ")}</div>}
      {r.overlappingFunctions.length > 0 && <div className="text-amber-400">重复输出：{r.overlappingFunctions.join(", ")}</div>}
    </div>
  );
}
