import type { CrossFunctionalIntent } from "@/lib/cross-functional/crossFunctionalIntentDetector";
import { INTENT_LABELS } from "@/constants/cross-functional/crossFunctionalIntentTypes";
import { WORKFLOW_LABELS } from "@/constants/cross-functional/crossFunctionalWorkflowTypes";
import { ENGINE_LABELS } from "@/constants/cross-functional/crossFunctionalEnginePairs";

export function CrossFunctionalIntentCard({ intent }: { intent: CrossFunctionalIntent }) {
  return (
    <div className="aether-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Cross-Functional Intent</div>
        <span className="text-[10px] rounded border px-1.5 py-0.5 text-muted-foreground">置信度 {(intent.confidence * 100).toFixed(0)}%</span>
      </div>
      <div className="font-display text-lg gold-text">{INTENT_LABELS[intent.intentType]}</div>
      <div className="text-xs text-muted-foreground">
        来源域：{ENGINE_LABELS[intent.sourceDomain] ?? intent.sourceDomain}
        ｜ 目标域：{intent.targetDomains.map((d) => ENGINE_LABELS[d] ?? d).join(" / ")}
      </div>
      <div className="text-xs">推荐工作流：<span className="text-primary">{WORKFLOW_LABELS[intent.recommendedWorkflowType]}</span></div>
      <div className="text-[11px] text-muted-foreground">
        必需引擎：{intent.requiredEngines.join("、")}
        {intent.optionalEngines.length > 0 && <> ｜ 可选：{intent.optionalEngines.join("、")}</>}
      </div>
      <div className="text-[11px] text-muted-foreground">风险等级：{intent.riskLevel}</div>
    </div>
  );
}
