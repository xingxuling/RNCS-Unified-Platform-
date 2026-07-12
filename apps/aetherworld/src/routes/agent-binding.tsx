import { createFileRoute } from "@tanstack/react-router";
import { AgentBindingPanel } from "@/components/agent-binding/AgentBindingPanel";

export const Route = createFileRoute("/agent-binding")({
  head: () => ({
    meta: [
      { title: "Agent Knowledge-Personality Binding · Agent 知识人格绑定计算法" },
      { name: "description", content: "把 Aetherworld 的知识层、数列主体人格层、计算法路由、对象接口、运行主干和治理守卫绑定到开源 Agent、工具、模型和运行时。" },
    ],
  }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Agent Knowledge-Personality Binding Calculus · v1.0</div>
        <h1 className="font-display text-2xl gold-text">Agent 知识人格绑定计算法</h1>
        <p className="text-sm text-muted-foreground">让任何接入的开源架构、Agent 框架、App Builder、代码沙箱、音乐模型、工作流系统都自动绑定 Aetherworld 的知识层、主体人格层、计算法路由、对象接口、运行主干和治理守卫。</p>
      </header>
      <AgentBindingPanel />
    </div>
  ),
});
