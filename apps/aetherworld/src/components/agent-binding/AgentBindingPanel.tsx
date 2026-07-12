import { useMemo, useState } from "react";
import { listAgentBindings } from "@/lib/agent-binding/agentBindingRegistry";
import { runAgentBinding, type AgentBindingRunResult } from "@/lib/agent-binding/agentBindingRunner";
import { AgentBindingSafetyNote } from "./AgentBindingSafetyNote";
import { AgentBindingRegistryTable } from "./AgentBindingRegistryTable";
import { AgentKnowledgeLayerPanel } from "./AgentKnowledgeLayerPanel";
import { AgentPersonalityLayerPanel } from "./AgentPersonalityLayerPanel";
import { AgentCalculusRoutePanel } from "./AgentCalculusRoutePanel";
import { AgentRuntimeTracePanel } from "./AgentRuntimeTracePanel";
import { AgentGovernancePanel } from "./AgentGovernancePanel";
import { AgentQaPanel } from "./AgentQaPanel";
import { AgentMemoryPolicyPanel } from "./AgentMemoryPolicyPanel";
import { AgentAutonomyPanel } from "./AgentAutonomyPanel";
import { AgentOutputPanel } from "./AgentOutputPanel";
import { AgentToolAdapterPanel } from "./AgentToolAdapterPanel";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-border/40 rounded p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-base font-medium tabular-nums">{value}</div>
    </div>
  );
}

export function AgentBindingPanel() {
  const bindings = useMemo(() => listAgentBindings(), []);
  const [bindingId, setBindingId] = useState(bindings[0]?.bindingId || "");
  const [intent, setIntent] = useState("做一个番茄钟网页");
  const [result, setResult] = useState<AgentBindingRunResult | null>(null);

  const profile = bindings.find((b) => b.bindingId === bindingId);

  const run = () => {
    const r = runAgentBinding(bindingId, intent);
    if ("error" in r) return;
    setResult(r);
  };

  const exportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `agent-binding-${result.runId}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const activeCount = bindings.filter((b) => b.status === "ACTIVE").length;
  const knowledgeCount = new Set(bindings.flatMap((b) => b.knowledgeBinding.enabledKnowledgeSources)).size;
  const personalityCount = bindings.filter((b) => b.personalityBinding.personalitySource.length > 0).length;

  return (
    <div className="space-y-5">
      <AgentBindingSafetyNote />

      <div className="aether-card p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
          <Stat label="Binding 总数" value={bindings.length} />
          <Stat label="活跃 Binding" value={activeCount} />
          <Stat label="知识源" value={knowledgeCount} />
          <Stat label="绑定人格" value={personalityCount} />
          <Stat label="QA 状态" value={result?.qa.status ?? "—"} />
          <Stat label="治理" value={result ? (result.governance.ok ? "OK" : "BLOCK") : "—"} />
        </div>
      </div>

      <div className="aether-card p-4 space-y-3">
        <div className="text-xs text-muted-foreground">选择 Binding 并输入任务</div>
        <div className="flex flex-col md:flex-row gap-2">
          <select value={bindingId} onChange={(e) => setBindingId(e.target.value)} className="bg-background border border-border/40 rounded px-2 py-1 text-sm min-w-[260px]">
            {bindings.map((b) => <option key={b.bindingId} value={b.bindingId}>{b.agentName}</option>)}
          </select>
          <textarea value={intent} onChange={(e) => setIntent(e.target.value)} rows={2} className="flex-1 bg-background border border-border/40 rounded px-2 py-1 text-sm" />
        </div>
        <div className="flex gap-2">
          <button onClick={run} className="aether-btn text-xs">运行 Agent 绑定</button>
          {result && <button onClick={exportJson} className="aether-btn-secondary text-xs">导出 JSON</button>}
        </div>
      </div>

      {profile && (
        <div className="grid md:grid-cols-2 gap-3">
          <AgentToolAdapterPanel profile={profile} />
          <AgentKnowledgeLayerPanel binding={profile.knowledgeBinding} />
          <AgentPersonalityLayerPanel binding={profile.personalityBinding} />
          <AgentCalculusRoutePanel routing={profile.calculusRouting} />
          <AgentMemoryPolicyPanel policy={profile.memoryPolicy} />
          <AgentAutonomyPanel policy={profile.autonomyPolicy} />
        </div>
      )}

      {result && (
        <div className="grid md:grid-cols-2 gap-3">
          <AgentGovernancePanel result={result.governance} />
          <AgentQaPanel qa={result.qa} />
          <AgentRuntimeTracePanel trace={result.trace} />
          <AgentOutputPanel output={result.output} />
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Agent Binding Registry</div>
        <AgentBindingRegistryTable />
      </div>
    </div>
  );
}
