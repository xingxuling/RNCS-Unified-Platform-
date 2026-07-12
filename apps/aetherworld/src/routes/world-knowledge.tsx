import { createFileRoute } from "@tanstack/react-router";
import { WorldKnowledgePanel } from "@/components/knowledge/WorldKnowledgePanel";

export const Route = createFileRoute("/world-knowledge")({
  head: () => ({
    meta: [
      { title: "世界知识引擎 · World Knowledge Engine" },
      { name: "description", content: "统一管理、分层、引用、检索、标注与校验 Aetherworld 所有知识来源。" },
    ],
  }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">世界知识引擎</h1>
        <p className="text-sm text-muted-foreground">
          区分现实事实、虚构设定、用户私有与演示数据；为 Sequence AI、模型生成、剧情、世界引擎等提供可信、分层、可追踪的知识上下文。
        </p>
      </header>
      <WorldKnowledgePanel />
    </div>
  ),
});
