import type { RuntimeGapResult } from "@/lib/missing-layer/runtimeGapDetector";

export function RuntimeGapPanel({ r }: { r: RuntimeGapResult }) {
  return (
    <div className="aether-card p-3 text-xs space-y-1">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">运行缺口</div>
      <div>评分 {r.runtimeGapScore}</div>
      {r.modulesWithoutRuntime.length > 0 && <div className="text-muted-foreground">未接 Runtime：{r.modulesWithoutRuntime.join(", ")}</div>}
    </div>
  );
}
