import { createFileRoute } from "@tanstack/react-router";
import { buildSystemLayerMap } from "@/lib/missing-layer/systemLayerMapEngine";
import { SystemLayerMap } from "@/components/missing-layer/SystemLayerMap";
import { SYSTEM_EVOLUTION_PHASE_LABELS, SYSTEM_EVOLUTION_PHASES } from "@/constants/missing-layer/systemEvolutionPhases";

function Page() {
  const map = buildSystemLayerMap();
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">System Evolution Map</div>
        <h1 className="font-display text-2xl gold-text">系统演化地图</h1>
        <p className="text-sm text-muted-foreground">从起步到归档的系统演化阶段，与各层成熟度对照。</p>
      </header>
      <div className="aether-card p-4 grid grid-cols-2 md:grid-cols-7 gap-2 text-xs">
        {SYSTEM_EVOLUTION_PHASES.map(p => (
          <div key={p} className="border border-border/40 rounded p-2 text-center">
            <div className="text-[10px] text-muted-foreground">{p}</div>
            <div className="font-display">{SYSTEM_EVOLUTION_PHASE_LABELS[p]}</div>
          </div>
        ))}
      </div>
      <SystemLayerMap map={map} />
    </div>
  );
}

export const Route = createFileRoute("/system-evolution-map")({
  head: () => ({ meta: [{ title: "System Evolution Map · 系统演化地图" }, { name: "description", content: "Aetherworld 系统演化阶段图。" }] }),
  component: Page,
});
