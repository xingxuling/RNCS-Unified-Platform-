import type { SequenceAIPlan } from "@/lib/sequence-ai/sequenceAIEnginePlanner";
import { getToolById } from "@/lib/sequence-ai/sequenceAIToolRegistry";

export function SequenceAIEngineTrace({ plan }: { plan?: SequenceAIPlan }) {
  if (!plan) return null;
  const name = (id: string) => getToolById(id)?.userVisibleName ?? id;
  return (
    <details className="rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs">
      <summary className="cursor-pointer text-muted-foreground">引擎调用链 · Engine Trace</summary>
      <div className="mt-2 space-y-1">
        <div><span className="text-muted-foreground">主引擎：</span>{name(plan.primaryEngine)}</div>
        <div><span className="text-muted-foreground">协同：</span>{plan.supportingEngines.map(name).join(" · ") || "—"}</div>
        <div><span className="text-muted-foreground">回验：</span>{plan.validationEngines.map(name).join(" · ") || "—"}</div>
        <div><span className="text-muted-foreground">可导出：</span>{plan.exportOptions.join(" / ")}</div>
        {plan.blockedEngines.length > 0 && (
          <div className="text-amber-500">阻断：{plan.blockedEngines.map(name).join(" · ")}</div>
        )}
        <ol className="mt-2 list-decimal list-inside space-y-0.5 text-muted-foreground">
          {plan.executionSteps.map((s, i) => (<li key={i}>{s}</li>))}
        </ol>
      </div>
    </details>
  );
}
