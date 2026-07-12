import { createFileRoute, Link } from "@tanstack/react-router";
import { listAgentBindings, getAgentBinding } from "@/lib/agent-binding/agentBindingRegistry";
import { AgentKnowledgeLayerPanel } from "@/components/agent-binding/AgentKnowledgeLayerPanel";
import { AgentPersonalityLayerPanel } from "@/components/agent-binding/AgentPersonalityLayerPanel";
import { AgentCalculusRoutePanel } from "@/components/agent-binding/AgentCalculusRoutePanel";
import { AgentToolAdapterPanel } from "@/components/agent-binding/AgentToolAdapterPanel";
import { AgentMemoryPolicyPanel } from "@/components/agent-binding/AgentMemoryPolicyPanel";
import { AgentAutonomyPanel } from "@/components/agent-binding/AgentAutonomyPanel";

interface Search { id?: string }

export const Route = createFileRoute("/agent-binding-entry")({
  validateSearch: (s: Record<string, unknown>): Search => ({ id: typeof s.id === "string" ? s.id : undefined }),
  head: () => ({ meta: [{ title: "Agent Binding Entry · Agent 绑定详情" }] }),
  component: function Page() {
    const { id } = Route.useSearch();
    const all = listAgentBindings();
    const profile = id ? getAgentBinding(id) : all[0];
    if (!profile) return <div className="p-6">未找到 Binding。</div>;
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-4">
        <header className="space-y-1">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Agent Binding Entry</div>
          <h1 className="font-display text-2xl gold-text">{profile.agentName}</h1>
          <p className="text-sm text-muted-foreground">{profile.bindingPurpose}</p>
        </header>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {all.map((b) => (
            <Link key={b.bindingId} to="/agent-binding-entry" search={{ id: b.bindingId }} className={`px-2 py-1 rounded border ${b.bindingId === profile.bindingId ? "bg-primary/10 border-primary/40" : "border-border/40"}`}>{b.agentName}</Link>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <AgentToolAdapterPanel profile={profile} />
          <AgentKnowledgeLayerPanel binding={profile.knowledgeBinding} />
          <AgentPersonalityLayerPanel binding={profile.personalityBinding} />
          <AgentCalculusRoutePanel routing={profile.calculusRouting} />
          <AgentMemoryPolicyPanel policy={profile.memoryPolicy} />
          <AgentAutonomyPanel policy={profile.autonomyPolicy} />
        </div>
      </div>
    );
  },
});
