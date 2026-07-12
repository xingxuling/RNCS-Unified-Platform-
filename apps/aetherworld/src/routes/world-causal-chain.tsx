import { createFileRoute } from "@tanstack/react-router";
import { WorldSimulationPanel } from "@/components/sequence-world/simulation/WorldSimulationPanel";

export const Route = createFileRoute("/world-causal-chain")({
  head: () => ({
    meta: [
      { title: "世界因果链 · Causal Chain" },
      { name: "description", content: "记录世界事件之间的因果关系，可用于剧情连续性与 QA 矛盾检查。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="font-display text-2xl gold-text mb-3">世界因果链</h1>
      <WorldSimulationPanel />
    </div>
  ),
});
