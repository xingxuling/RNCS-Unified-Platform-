import type { AgentQaResult } from "@/lib/agent-binding/agentQaBridge";

export function AgentQaPanel({ qa }: { qa: AgentQaResult }) {
  return (
    <div className="aether-card p-3 text-xs space-y-1">
      <div className="text-[11px] text-muted-foreground">Agent Binding QA · {qa.status}</div>
      <ul className="space-y-0.5">
        {qa.checks.map((c) => (
          <li key={c.id} className="flex justify-between">
            <span>{c.id}</span>
            <span className={c.ok ? "text-emerald-400" : "text-red-400"}>{c.ok ? "OK" : "FAIL"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
