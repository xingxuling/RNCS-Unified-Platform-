import { createFileRoute } from "@tanstack/react-router";
import { RealityDataCalibrationPanel } from "@/components/reality-data/RealityDataCalibrationPanel";

export const Route = createFileRoute("/reality-data")({
  head: () => ({
    meta: [
      { title: "现实数据 · Reality Data — Aetherworld" },
      { name: "description", content: "外部现实数据校准引擎：接入外部数据、可信度评分、新鲜度检测与主体数列防火墙。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <RealityDataCalibrationPanel />
    </div>
  ),
});
