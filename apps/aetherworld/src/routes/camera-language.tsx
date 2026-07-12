import { createFileRoute } from "@tanstack/react-router";
import { WorldPresentationPanel } from "@/components/sequence-world/presentation/WorldPresentationPanel";

export const Route = createFileRoute("/camera-language")({
  head: () => ({ meta: [
    { title: "镜头语言 · Camera Language" },
    { name: "description", content: "根据世界状态生成默认镜头、节奏、转场与事件镜头规则。" },
  ]}),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="font-display text-2xl mb-3">镜头语言</h1>
      <WorldPresentationPanel />
    </div>
  ),
});
