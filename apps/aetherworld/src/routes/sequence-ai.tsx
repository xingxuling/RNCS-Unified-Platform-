import { createFileRoute } from "@tanstack/react-router";
import { SequenceAIChat } from "@/components/sequence-ai/SequenceAIChat";

export const Route = createFileRoute("/sequence-ai")({
  head: () => ({
    meta: [
      { title: "Sequence AI · 数列人工智能" },
      { name: "description", content: "应用统一智能入口：理解意图、路由引擎、合成结构化建议与可导出资产。" },
    ],
  }),
  component: () => (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Sequence AI · 数列人工智能</h1>
        <p className="text-sm text-muted-foreground">
          基于主体数列、MSL、Omni 调度、模型生成与多专业引擎的统一智能体。说出你的目标，系统会路由到合适的引擎并给出可执行结果。
        </p>
      </header>
      <SequenceAIChat />
    </div>
  ),
});
