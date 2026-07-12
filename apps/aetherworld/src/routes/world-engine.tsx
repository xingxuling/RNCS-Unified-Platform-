import { createFileRoute } from "@tanstack/react-router";
import { SequenceWorldPanel } from "@/components/sequence-world/SequenceWorldPanel";

export const Route = createFileRoute("/world-engine")({
  head: () => ({
    meta: [
      { title: "World Engine SDK · 世界引擎 SDK" },
      { name: "description", content: "数列驱动的世界逻辑层 SDK。生成世界状态、渲染参数、语义物理、动画、NPC 行为、任务与区域。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <SequenceWorldPanel />
    </div>
  ),
});
