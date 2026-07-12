import { createFileRoute } from "@tanstack/react-router";
import { WorldPresentationPanel } from "@/components/sequence-world/presentation/WorldPresentationPanel";

export const Route = createFileRoute("/render-runtime")({
  head: () => ({ meta: [
    { title: "渲染运行时 · Render Runtime" },
    { name: "description", content: "查看由数列驱动生成的渲染运行时参数（调色板、光照、材质、粒子、后处理）。" },
  ]}),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="font-display text-2xl mb-3">渲染运行时 · Render Runtime</h1>
      <p className="text-xs text-muted-foreground mb-4">渲染运行时随世界状态变化。完整面板入口位于「世界表现层」。</p>
      <WorldPresentationPanel />
    </div>
  ),
});
