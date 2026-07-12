import type { AetherAgentOutput } from "@/lib/agent-binding/agentOutputAdapter";

export function AgentOutputPanel({ output }: { output: AetherAgentOutput }) {
  return (
    <div className="aether-card p-3 text-xs space-y-2">
      <div className="text-[11px] text-muted-foreground">{output.title}</div>
      <div>{output.summary}</div>
      <div><span className="text-muted-foreground">产出对象：</span>{output.producedObjects.join("、")}</div>
      <div><span className="text-muted-foreground">下一步：</span>{output.nextSuggestedActions.join(" → ")}</div>
      <pre className="bg-muted/20 rounded p-2 overflow-x-auto text-[10px]">{JSON.stringify(output.structuredResult, null, 2)}</pre>
    </div>
  );
}
