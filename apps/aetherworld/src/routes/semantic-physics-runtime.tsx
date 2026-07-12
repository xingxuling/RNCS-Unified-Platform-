import { createFileRoute } from "@tanstack/react-router";
import { WorldPresentationPanel } from "@/components/sequence-world/presentation/WorldPresentationPanel";

export const Route = createFileRoute("/semantic-physics-runtime")({
  head: () => ({ meta: [
    { title: "语义物理运行时 · Semantic Physics Runtime" },
    { name: "description", content: "语义物理场参数：运动趋势、引力、阻尼、流场、吸引场、坍缩与恢复规则。" },
  ]}),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="font-display text-2xl mb-3">语义物理运行时</h1>
      <p className="text-xs text-muted-foreground mb-4">语义物理 ≠ 精确物理仿真。用于游戏 gameplay 与表现层参数。</p>
      <WorldPresentationPanel />
    </div>
  ),
});
