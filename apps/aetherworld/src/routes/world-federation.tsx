import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { WorldFederationPanel } from "@/components/sequence-world/multiverse/WorldFederationPanel";
import { runMultiWorldNetwork } from "@/lib/sequence-world/multiverse/multiWorldNetworkEngine";

export const Route = createFileRoute("/world-federation")({
  head: () => ({
    meta: [
      { title: "世界联邦 · World Federation" },
      { name: "description", content: "稳定关系下形成的世界联邦及共享规则。" },
    ],
  }),
  component: () => {
    const r = useMemo(() => runMultiWorldNetwork({ subjectMode: "DEMO" }), []);
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <h1 className="font-display text-2xl gold-text mb-1">世界联邦 · World Federation</h1>
        <p className="text-xs text-muted-foreground mb-4">联邦共享规则需通过正典检查。Founder Domain 仅 Founder 操作。</p>
        <WorldFederationPanel federation={r.federation} />
      </div>
    );
  },
});
