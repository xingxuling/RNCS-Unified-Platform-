import { createFileRoute, Link } from "@tanstack/react-router";
import { loadAllWorldStates } from "@/lib/worldMemoryEngine";
import { WorldMapPanel } from "@/components/WorldMapPanel";
import { VirtualWorldSafetyNote } from "@/components/VirtualWorldSafetyNote";

export const Route = createFileRoute("/world-map")({
  head: () => ({ meta: [{ title: "世界地图｜Virtual World" }] }),
  component: () => {
    const state = loadAllWorldStates()[0];
    return (
      <div className="space-y-4 max-w-7xl mx-auto p-4 lg:p-6">
        <h1 className="font-display text-2xl gold-text">世界地图 · World Map</h1>
        <VirtualWorldSafetyNote worldMode={state?.worldMode} />
        {state ? <WorldMapPanel zones={state.zones} /> : (
          <div className="aether-card p-6 text-sm text-muted-foreground">
            尚未生成虚拟世界。<Link to="/virtual-world" className="text-primary underline ml-1">前往生成</Link>
          </div>
        )}
      </div>
    );
  },
});
