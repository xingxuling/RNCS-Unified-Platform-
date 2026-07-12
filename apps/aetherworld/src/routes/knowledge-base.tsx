import { createFileRoute } from "@tanstack/react-router";
import { WorldKnowledgePanel } from "@/components/knowledge/WorldKnowledgePanel";

export const Route = createFileRoute("/knowledge-base")({
  head: () => ({
    meta: [
      { title: "知识库 · Knowledge Base" },
      { name: "description", content: "搜索、过滤与新增 Aetherworld 知识条目。" },
    ],
  }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">知识库</h1>
        <p className="text-sm text-muted-foreground">不需要懂内部模块结构——直接搜索你想了解的概念。</p>
      </header>
      <WorldKnowledgePanel />
    </div>
  ),
});
