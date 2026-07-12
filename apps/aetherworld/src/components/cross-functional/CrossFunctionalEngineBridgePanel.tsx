import type { CrossFunctionalEngineBridge } from "@/lib/cross-functional/crossFunctionalEngineBridge";
import { ENGINE_LABELS } from "@/constants/cross-functional/crossFunctionalEnginePairs";

export function CrossFunctionalEngineBridgePanel({ bridges }: { bridges: CrossFunctionalEngineBridge[] }) {
  if (!bridges.length) {
    return <div className="aether-card p-4 text-xs text-muted-foreground">当前没有匹配的引擎桥。</div>;
  }
  return (
    <div className="space-y-2">
      {bridges.map((b) => (
        <div key={b.bridgeId} className="aether-card p-3 space-y-1">
          <div className="text-sm">
            <span className="text-foreground">{ENGINE_LABELS[b.sourceEngine] ?? b.sourceEngine}</span>
            <span className="mx-2 text-primary">→</span>
            <span className="text-foreground">{ENGINE_LABELS[b.targetEngine] ?? b.targetEngine}</span>
            <span className="ml-2 text-[10px] rounded border px-1 py-0.5 text-muted-foreground">{b.bridgeType}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">输入适配：{b.inputAdapter}</div>
          <div className="text-[11px] text-muted-foreground">输出适配：{b.outputAdapter}</div>
          {b.requiredVariables.length > 0 && (
            <div className="text-[11px] text-muted-foreground">必需变量：{b.requiredVariables.join("、")}</div>
          )}
          {b.safetyRules.length > 0 && (
            <div className="text-[11px] text-amber-500/90">安全边界：{b.safetyRules.join("；")}</div>
          )}
        </div>
      ))}
    </div>
  );
}
