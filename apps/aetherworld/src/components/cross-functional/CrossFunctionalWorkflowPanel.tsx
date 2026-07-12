import type { CrossFunctionalWorkflow } from "@/lib/cross-functional/crossFunctionalWorkflowPlanner";
import { ENGINE_LABELS } from "@/constants/cross-functional/crossFunctionalEnginePairs";

export function CrossFunctionalWorkflowPanel({
  workflow,
  alternatives,
  onSwitch,
}: {
  workflow: CrossFunctionalWorkflow;
  alternatives?: CrossFunctionalWorkflow[];
  onSwitch?: (w: CrossFunctionalWorkflow) => void;
}) {
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">推荐工作流</div>
          <div className="font-display text-lg gold-text">{workflow.title}</div>
        </div>
        <span className="text-[10px] rounded border px-1.5 py-0.5 text-muted-foreground">复杂度 {workflow.estimatedComplexity}</span>
      </div>
      <ol className="space-y-2">
        {workflow.steps.map((s, i) => (
          <li key={s.stepId} className="flex items-start gap-3 text-sm">
            <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] flex items-center justify-center shrink-0">{i + 1}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-foreground">{s.stepName}</span>
                <span className="text-[10px] text-muted-foreground">· {ENGINE_LABELS[s.engineId] ?? s.engineId}</span>
                {s.requiresUserReview && <span className="text-[10px] text-amber-500">需复核</span>}
              </div>
              <div className="text-xs text-muted-foreground">{s.inputSummary} → {s.outputSummary}</div>
            </div>
          </li>
        ))}
      </ol>
      {alternatives && alternatives.length > 0 && (
        <div className="pt-2 border-t border-border/50">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">备选工作流</div>
          <div className="flex flex-wrap gap-2">
            {alternatives.map((w) => (
              <button
                key={w.workflowId}
                onClick={() => onSwitch?.(w)}
                className="text-[11px] rounded border border-border/60 px-2 py-1 hover:border-primary/50 transition"
              >
                {w.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
