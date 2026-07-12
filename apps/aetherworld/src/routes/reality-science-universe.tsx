import { createFileRoute } from "@tanstack/react-router";
import { RealityScienceUniversePanel } from "@/components/RealityScienceUniversePanel";
import { ScienceConstantMatrix } from "@/components/ScienceConstantMatrix";

export const Route = createFileRoute("/reality-science-universe")({
  head: () => ({
    meta: [
      { title: "现实科学宇宙常数 · Reality Science Universe" },
      { name: "description", content: "10 大数字化现实科学常数域，用于评估虚拟创造物的可行性、阻力、节律与审美。" },
    ],
  }),
  component: RealityScienceUniverseRoute,
});

function RealityScienceUniverseRoute() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <RealityScienceUniversePanel />
      <ScienceConstantMatrix />
    </div>
  );
}
