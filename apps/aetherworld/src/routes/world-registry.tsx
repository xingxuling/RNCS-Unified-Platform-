import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { WorldRegistryPanel } from "@/components/sequence-world/multiverse/WorldRegistryPanel";
import { runMultiWorldNetwork } from "@/lib/sequence-world/multiverse/multiWorldNetworkEngine";

export const Route = createFileRoute("/world-registry")({
  head: () => ({
    meta: [
      { title: "世界注册表 · World Registry" },
      { name: "description", content: "查看所有已注册的世界与其身份元数据。" },
    ],
  }),
  component: WorldRegistryPage,
});

function WorldRegistryPage() {
  const r = useMemo(() => runMultiWorldNetwork({ subjectMode: "DEMO" }), []);
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="font-display text-2xl gold-text mb-1">世界注册表 · World Registry</h1>
      <p className="text-xs text-muted-foreground mb-4">每个世界都有独立身份、隐私级别与正典边界。</p>
      <WorldRegistryPanel worlds={r.worlds} />
    </div>
  );
}
