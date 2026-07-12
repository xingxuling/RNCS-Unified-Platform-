import { createFileRoute } from "@tanstack/react-router";
import { WorldSimulationPanel } from "@/components/sequence-world/simulation/WorldSimulationPanel";

export const Route = createFileRoute("/world-simulation")({
  head: () => ({
    meta: [
      { title: "世界模拟 · World Simulation" },
      { name: "description", content: "Aether Sequence World Engine v0.2 — 可 tick、可记忆、可因果、可快照、可导出 Runtime 的数列世界模拟内核。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <WorldSimulationPanel />
    </div>
  ),
});
