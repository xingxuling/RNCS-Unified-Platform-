import { createFileRoute } from "@tanstack/react-router";
import { CivilizationEvolutionPanel } from "@/components/sequence-world/civilization/CivilizationEvolutionPanel";

export const Route = createFileRoute("/civilization-evolution")({
  head: () => ({
    meta: [
      { title: "文明演化 · Civilization Evolution Core v0.5" },
      { name: "description", content: "数列驱动文明演化与历史模拟内核：时间线、时代、技术树、战争和平、神话、编年史与导出。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <CivilizationEvolutionPanel />
    </div>
  ),
});
