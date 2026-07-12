import { createFileRoute } from "@tanstack/react-router";
import { WorldGrowthPanel } from "@/components/sequence-world/growth/WorldGrowthPanel";

export const Route = createFileRoute("/world-growth")({
  head: () => ({
    meta: [
      { title: "World Growth · 世界生长" },
      { name: "description", content: "Self-Growing World OS v0.3 — 让数列世界自动生长、扩张、变异、修复与压缩。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <WorldGrowthPanel />
    </div>
  ),
});
