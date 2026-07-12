import { createFileRoute } from "@tanstack/react-router";
import { BioEvolutionDashboard } from "@/components/BioEvolutionDashboard";

export const Route = createFileRoute("/bio-evolution")({
  head: () => ({
    meta: [
      { title: "我的 App 进化 · Bio-Product Self-Evolution" },
      { name: "description", content: "在本地根据你的使用与回验，让这个 App 慢慢变得更适合你。" },
    ],
  }),
  component: BioEvolutionRoute,
});

function BioEvolutionRoute() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BioEvolutionDashboard />
    </div>
  );
}
