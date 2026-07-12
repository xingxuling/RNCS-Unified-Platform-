import { createFileRoute } from "@tanstack/react-router";
import { AgentBindingRegistryTable } from "@/components/agent-binding/AgentBindingRegistryTable";

export const Route = createFileRoute("/agent-binding-registry")({
  head: () => ({
    meta: [
      { title: "Agent Binding Registry · Agent 绑定注册表" },
      { name: "description", content: "查看 Aetherworld 已注册的 Agent Binding Profile。" },
    ],
  }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header>
        <h1 className="font-display text-2xl gold-text">Agent 绑定注册表</h1>
        <p className="text-sm text-muted-foreground">所有 App Builder / 代码沙箱 / 音乐 / 工作流 / Chatbot / RAG / 设计 / 部署 / QA Agent 的绑定配置。</p>
      </header>
      <AgentBindingRegistryTable />
    </div>
  ),
});
