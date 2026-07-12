import type { WorldResourceFlow } from "@/lib/sequence-world/simulation/worldResourceFlowEngine";

export function WorldResourceFlowPanel({ flow }: { flow: WorldResourceFlow }) {
  return (
    <div className="aether-card p-4">
      <h3 className="font-display gold-text mb-2">资源流动</h3>
      <div className="text-xs text-muted-foreground mb-2">主导资源：<span className="text-foreground">{flow.dominantResource}</span></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {Object.entries(flow.resources).map(([k, v]) => (
          <div key={k} className="aether-card p-2 flex justify-between"><span className="text-muted-foreground">{k}</span><span className="text-foreground">{v}</span></div>
        ))}
      </div>
      {flow.scarcityWarnings.length > 0 && (
        <div className="mt-3 text-xs text-amber-300">⚠ {flow.scarcityWarnings.join("； ")}</div>
      )}
      <div className="mt-3 text-xs text-muted-foreground">
        最近流入 {flow.inflow.length} · 流出 {flow.outflow.length}
      </div>
    </div>
  );
}
