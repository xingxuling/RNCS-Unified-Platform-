import type { AgentRuntimeTrace } from "@/lib/agent-binding/agentRuntimeSpineBridge";

export function AgentRuntimeTracePanel({ trace }: { trace: AgentRuntimeTrace }) {
  return (
    <div className="aether-card p-3 text-xs">
      <div className="text-[11px] text-muted-foreground mb-2">Runtime Spine · {trace.traceId}</div>
      <ol className="space-y-1">
        {trace.steps.map((s, i) => (
          <li key={i} className="flex items-center justify-between border-t border-border/20 pt-1">
            <span>{i + 1}. {s.step}</span>
            <span className={s.status === "BLOCKED" ? "text-red-400" : s.status === "SKIPPED" ? "text-muted-foreground" : "text-emerald-400"}>{s.status}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
