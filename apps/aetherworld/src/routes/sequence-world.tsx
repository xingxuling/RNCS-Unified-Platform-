import { createFileRoute } from "@tanstack/react-router";
import { SequenceWorldPanel } from "@/components/sequence-world/SequenceWorldPanel";

export const Route = createFileRoute("/sequence-world")({
  head: () => ({
    meta: [
      { title: "数列世界引擎 · Sequence World Engine" },
      { name: "description", content: "Aether Sequence World Engine SDK v0.1：把主体/对象数列驱动为世界状态、渲染、语义物理、动画、NPC、任务与多引擎导出。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <SequenceWorldPanel />
    </div>
  ),
});
