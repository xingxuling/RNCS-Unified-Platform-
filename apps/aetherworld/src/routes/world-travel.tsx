import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { WorldTravelPanel } from "@/components/sequence-world/multiverse/WorldTravelPanel";
import { runMultiWorldNetwork } from "@/lib/sequence-world/multiverse/multiWorldNetworkEngine";

export const Route = createFileRoute("/world-travel")({
  head: () => ({
    meta: [
      { title: "世界互访 · World Travel" },
      { name: "description", content: "在多个世界之间互访，记录旅行状态。" },
    ],
  }),
  component: () => {
    const r = useMemo(() => runMultiWorldNetwork({ subjectMode: "DEMO" }), []);
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <h1 className="font-display text-2xl gold-text mb-1">世界互访 · World Travel</h1>
        <p className="text-xs text-muted-foreground mb-4">旅行只影响虚拟世界，不代表现实行动。</p>
        <WorldTravelPanel worlds={r.worlds} portals={r.portals} state={r.userTravelState} />
      </div>
    );
  },
});
