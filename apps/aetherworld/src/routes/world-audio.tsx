import { createFileRoute } from "@tanstack/react-router";
import { WorldPresentationPanel } from "@/components/sequence-world/presentation/WorldPresentationPanel";

export const Route = createFileRoute("/world-audio")({
  head: () => ({ meta: [
    { title: "世界声音 · World Audio Atmosphere" },
    { name: "description", content: "世界声音氛围、音乐情绪、乐器与事件声效。可接入声乐引擎。" },
  ]}),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="font-display text-2xl mb-3">世界声音</h1>
      <WorldPresentationPanel />
    </div>
  ),
});
