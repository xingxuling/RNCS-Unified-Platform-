import type { ConceptExpansionPlan } from "@/lib/weblcm/webLcmTypes";

export function WebLcmWebLlmBridgePanel({ expansion }: { expansion: ConceptExpansionPlan | null | undefined }) {
  if (!expansion) return <div className="text-xs text-muted-foreground p-3 rounded border border-border/40">尚未构建 WebLLM 展开计划。</div>;
  return (
    <div className="space-y-2 text-xs">
      <div className="rounded border border-border/40 p-3">
        <div className="font-semibold">目标引擎：{expansion.targetEngine}</div>
        <div className="text-muted-foreground">输出契约：{expansion.outputContract.join(" / ")}</div>
        <div className="text-muted-foreground">安全规则：{expansion.safetyRules.join(" / ")}</div>
      </div>
      <details className="rounded border border-border/40 p-3" open>
        <summary className="cursor-pointer font-semibold">展开 Prompt</summary>
        <pre className="whitespace-pre-wrap mt-2 text-[10px] text-muted-foreground">{expansion.expansionPrompt}</pre>
      </details>
    </div>
  );
}
