import type { MissingLayerDetectionResult } from "@/lib/missing-layer/missingLayerDetectionCalculus";
import { runMissingLayerQa } from "@/lib/missing-layer/missingLayerQaBridge";

export function MissingLayerQaPanel({ result }: { result: MissingLayerDetectionResult }) {
  const qa = runMissingLayerQa(result);
  return (
    <div className="aether-card p-3 text-xs space-y-1">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Missing-Layer QA</div>
      <div className={qa.passed ? "text-emerald-400" : "text-amber-400"}>{qa.passed ? "通过" : "存在问题"}</div>
      {qa.issues.map((i, idx) => (<div key={idx} className="text-muted-foreground">· {i}</div>))}
      <div className="text-[10px] text-muted-foreground">最终决策：{result.finalDecision}</div>
    </div>
  );
}
