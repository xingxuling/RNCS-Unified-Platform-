import { createFileRoute } from "@tanstack/react-router";
import { WorldPresentationPanel } from "@/components/sequence-world/presentation/WorldPresentationPanel";

export const Route = createFileRoute("/animation-runtime")({
  head: () => ({ meta: [
    { title: "动画运行时 · Animation Runtime" },
    { name: "description", content: "由数列驱动的动画状态机参数：idle、transition、NPC bias、事件触发与 UI 动效。" },
  ]}),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="font-display text-2xl mb-3">动画运行时</h1>
      <WorldPresentationPanel />
    </div>
  ),
});
