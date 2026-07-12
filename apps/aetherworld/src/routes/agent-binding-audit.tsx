import { createFileRoute } from "@tanstack/react-router";
import { listAgentBindings } from "@/lib/agent-binding/agentBindingRegistry";
import { runAgentBindingQa } from "@/lib/agent-binding/agentQaBridge";
import { evaluateAgentSafety } from "@/lib/agent-binding/agentSafetyGuard";

export const Route = createFileRoute("/agent-binding-audit")({
  head: () => ({ meta: [{ title: "Agent Binding Audit · Agent 绑定审计" }] }),
  component: function Page() {
    const list = listAgentBindings();
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-4">
        <header>
          <h1 className="font-display text-2xl gold-text">Agent 绑定审计</h1>
          <p className="text-sm text-muted-foreground">检查每个 Agent Binding 是否符合知识、人格、对象、Runtime、治理、QA 与隐私要求。</p>
        </header>
        <div className="space-y-3">
          {list.map((b) => {
            const qa = runAgentBindingQa(b);
            const safety = evaluateAgentSafety(b);
            return (
              <div key={b.bindingId} className="aether-card p-3 text-xs space-y-2">
                <div className="flex justify-between"><div className="font-medium">{b.agentName}</div><div className={qa.status === "PASS" ? "text-emerald-400" : qa.status === "WARN" ? "text-amber-300" : "text-red-400"}>{qa.status}</div></div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-1">
                  {qa.checks.map((c) => <div key={c.id} className="flex justify-between border border-border/30 rounded px-2 py-1"><span>{c.id}</span><span className={c.ok ? "text-emerald-400" : "text-red-400"}>{c.ok ? "OK" : "FAIL"}</span></div>)}
                </div>
                {safety.notes.length > 0 && <div className="text-amber-300">安全提示：{safety.notes.join("；")}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
});
