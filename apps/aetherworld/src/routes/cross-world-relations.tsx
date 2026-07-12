import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CrossWorldRelationGraph } from "@/components/sequence-world/multiverse/CrossWorldRelationGraph";
import { runMultiWorldNetwork } from "@/lib/sequence-world/multiverse/multiWorldNetworkEngine";

export const Route = createFileRoute("/cross-world-relations")({
  head: () => ({
    meta: [
      { title: "跨世界关系 · Cross-World Relations" },
      { name: "description", content: "世界之间的关系网络、信任、冲突与资源流。" },
    ],
  }),
  component: () => {
    const r = useMemo(() => runMultiWorldNetwork({ subjectMode: "DEMO" }), []);
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <h1 className="font-display text-2xl gold-text mb-1">跨世界关系 · Cross-World Relations</h1>
        <p className="text-xs text-muted-foreground mb-4">同盟、镜像、贸易、归档、梦境等关系类型。</p>
        <CrossWorldRelationGraph relations={r.crossWorldRelations} worlds={r.worlds} />
      </div>
    );
  },
});
