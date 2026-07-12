import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { WorldPortalPanel } from "@/components/sequence-world/multiverse/WorldPortalPanel";
import { runMultiWorldNetwork } from "@/lib/sequence-world/multiverse/multiWorldNetworkEngine";

export const Route = createFileRoute("/world-portals")({
  head: () => ({
    meta: [
      { title: "世界门户 · World Portals" },
      { name: "description", content: "查看、创建、管理跨世界门户。" },
    ],
  }),
  component: () => {
    const r = useMemo(() => runMultiWorldNetwork({ subjectMode: "DEMO" }), []);
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <h1 className="font-display text-2xl gold-text mb-1">世界门户 · World Portals</h1>
        <p className="text-xs text-muted-foreground mb-4">门户连接两个世界，仅为虚拟结构事件，不代表现实行动。</p>
        <WorldPortalPanel portals={r.portals} worlds={r.worlds} />
      </div>
    );
  },
});
