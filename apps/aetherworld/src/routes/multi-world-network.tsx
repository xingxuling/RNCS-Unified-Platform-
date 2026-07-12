import { createFileRoute } from "@tanstack/react-router";
import { MultiWorldNetworkPanel } from "@/components/sequence-world/multiverse/MultiWorldNetworkPanel";

export const Route = createFileRoute("/multi-world-network")({
  head: () => ({
    meta: [
      { title: "多世界网络 · Multi-World Network" },
      { name: "description", content: "Aether Sequence World Engine v0.7：数列驱动的多世界网络与世界门户运行时。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="font-display text-2xl gold-text mb-1">多世界网络 · Multi-World Network</h1>
      <p className="text-xs text-muted-foreground mb-4">v0.7：注册世界、连接门户、跨世界互访、迁移与导出。所有结构均为虚拟世界，不代表现实事实。</p>
      <MultiWorldNetworkPanel />
    </div>
  ),
});
