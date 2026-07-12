import type { SystemLayerMap as SystemLayerMapData } from "@/lib/missing-layer/systemLayerMapEngine";
import { SYSTEM_LAYER_LABELS } from "@/constants/missing-layer/systemLayerTypes";

export function SystemLayerMap({ map }: { map: SystemLayerMapData }) {
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">System Layer Map</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {map.layers.map(l => (
          <div key={l.layerType} className="border border-border/40 rounded p-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium">{SYSTEM_LAYER_LABELS[l.layerType]}</span>
              <span className={`text-[10px] ${l.maturity === "LOW" ? "text-red-400" : l.maturity === "OVERBUILT" ? "text-amber-400" : "text-muted-foreground"}`}>{l.maturity}</span>
            </div>
            <div className="text-muted-foreground mt-1">{l.modules.length} 模块</div>
            {l.notes.map((n, i) => (<div key={i} className="text-[10px] text-amber-400">{n}</div>))}
          </div>
        ))}
      </div>
      {map.missingLayers.length > 0 && (
        <div className="text-xs text-red-400">缺失层：{map.missingLayers.map(l => SYSTEM_LAYER_LABELS[l]).join("、")}</div>
      )}
    </div>
  );
}
