import type { SystemCapabilityMap as SystemCapabilityMapData } from "@/lib/missing-layer/systemCapabilityScanner";
import { SYSTEM_LAYER_LABELS } from "@/constants/missing-layer/systemLayerTypes";

export function SystemCapabilityMap({ map }: { map: SystemCapabilityMapData }) {
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">System Capability Map</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <Stat label="总能力" value={map.totalCapabilities} />
        <Stat label="活跃" value={map.activeCapabilities} />
        <Stat label="部分完成" value={map.partialCapabilities} />
        <Stat label="缺文档" value={map.missingDocsCount} />
        <Stat label="缺 QA" value={map.missingQaCount} />
        <Stat label="缺 Runtime" value={map.missingRuntimeCount} />
        <Stat label="缺对象化" value={map.missingObjectLayerCount} />
      </div>
      <div className="space-y-1 max-h-72 overflow-auto">
        {map.capabilities.map(c => (
          <div key={c.capabilityId} className="flex items-center justify-between text-xs border border-border/40 rounded px-2 py-1">
            <div>
              <span className="font-medium">{c.capabilityName}</span>
              <span className="ml-2 text-muted-foreground">{SYSTEM_LAYER_LABELS[c.layerType]}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-background/30 border border-border/40 rounded p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-lg font-display">{value}</div>
    </div>
  );
}
