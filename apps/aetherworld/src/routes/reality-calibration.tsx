import { createFileRoute } from "@tanstack/react-router";
import { CalibrationPlanPanel } from "@/components/reality-data/CalibrationPlanPanel";
import { SubjectSequenceFirewallPanel } from "@/components/reality-data/SubjectSequenceFirewallPanel";
import { SourceCredibilityCard } from "@/components/reality-data/SourceCredibilityCard";
import { RealityDataSafetyNote } from "@/components/reality-data/RealityDataSafetyNote";

export const Route = createFileRoute("/reality-calibration")({
  head: () => ({
    meta: [
      { title: "现实校准 · Reality Calibration" },
      { name: "description", content: "根据问题类型自动分配主体数列与外部数据的权重，并通过主体数列防火墙保护核心。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">现实校准</h1>
        <p className="text-sm text-muted-foreground">主体数列 + 外部数据 + 回验的分层校准。</p>
      </header>
      <div className="grid md:grid-cols-2 gap-4">
        <CalibrationPlanPanel />
        <SubjectSequenceFirewallPanel />
        <SourceCredibilityCard />
      </div>
      <RealityDataSafetyNote />
    </div>
  ),
});
