import { createFileRoute } from "@tanstack/react-router";
import { runMissingLayerDetection } from "@/lib/missing-layer/missingLayerDetectionCalculus";
import { SystemCapabilityMap } from "@/components/missing-layer/SystemCapabilityMap";
import { SystemLayerMap } from "@/components/missing-layer/SystemLayerMap";

function Page() {
  const result = runMissingLayerDetection();
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">System Gap Map</div>
        <h1 className="font-display text-2xl gold-text">系统缺口地图</h1>
        <p className="text-sm text-muted-foreground">按层级展示 Aetherworld 当前系统能力与缺口分布。</p>
      </header>
      <SystemCapabilityMap map={result.systemCapabilityMap} />
      <SystemLayerMap map={result.systemLayerMap} />
    </div>
  );
}

export const Route = createFileRoute("/system-gap-map")({
  head: () => ({ meta: [{ title: "System Gap Map · 系统缺口地图" }, { name: "description", content: "Aetherworld 系统能力与缺口地图。" }] }),
  component: Page,
});
