import { createFileRoute } from "@tanstack/react-router";
import { WorldPresentationPanel } from "@/components/sequence-world/presentation/WorldPresentationPanel";

export const Route = createFileRoute("/world-presentation")({
  head: () => ({
    meta: [
      { title: "世界表现层 · World Presentation Runtime v0.6" },
      { name: "description", content: "数列驱动世界表现层运行内核：渲染、语义物理、动画、镜头、声音、UI 动效与 Godot / Unity / Three.js 导出。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <WorldPresentationPanel />
    </div>
  ),
});
