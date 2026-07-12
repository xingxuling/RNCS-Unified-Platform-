import type { WebLlmRuntimeResult } from "@/lib/webllm/aetherWebLlmRuntime";

export function WebLlmRunTracePanel({ r }: { r: WebLlmRuntimeResult | null }) {
  if (!r) return <div className="border border-border/40 rounded p-3 text-sm text-muted-foreground">尚无运行记录。</div>;
  const row = (k: string, v: string | number | boolean) => (
    <div className="flex justify-between text-[11px] py-0.5"><span className="text-muted-foreground">{k}</span><span className="font-mono">{String(v)}</span></div>
  );
  return (
    <div className="border border-border/40 rounded p-3 space-y-1">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Run Trace · 运行轨迹</div>
      {row("runId", r.result.runId)}
      {row("model", r.result.modelId)}
      {row("mode", r.request.runtimeMode)}
      {row("status", r.result.status)}
      {row("fallback", r.result.fallbackUsed)}
      {row("predict.err", r.predictiveError.status)}
      {row("local.detail", r.localDetail.status)}
      {row("executive", r.executiveGate.requiresHumanReview ? "human_review" : "ok")}
      {row("qa", r.qa.status)}
      {row("workspace", r.workspaceRecordId ?? "—")}
    </div>
  );
}
