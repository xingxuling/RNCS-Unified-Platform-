import type { SimulatedZone } from "@/lib/sequence-world/simulation/zoneEcologyEngine";

export function ZoneEcologyMap({ zones }: { zones: SimulatedZone[] }) {
  return (
    <div className="aether-card p-4">
      <h3 className="font-display gold-text mb-2">区域生态</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        {zones.map(z => (
          <div key={z.zoneId} className="aether-card p-3">
            <div className="flex justify-between"><span className="text-foreground font-medium">{z.name}</span><span className="text-muted-foreground">{z.zoneType}</span></div>
            <div className="text-muted-foreground mt-1 grid grid-cols-2 gap-1">
              <span>稳定 {z.stability.toFixed(2)}</span>
              <span>事件 {z.eventPressure.toFixed(2)}</span>
              <span>资源 {z.resourceDensity.toFixed(2)}</span>
              <span>NPC {z.npcDensity.toFixed(2)}</span>
              <span>隐藏 {z.hiddenLayer.toFixed(2)}</span>
              <span>主导 {z.dominantDigits.join(",")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
