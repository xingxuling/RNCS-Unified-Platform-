import { createFileRoute } from "@tanstack/react-router";
import { ConstantUniversePanel } from "@/components/constants-universe/ConstantUniversePanel";

export const Route = createFileRoute("/constants-universe")({
  head: () => ({
    meta: [
      { title: "常数宇宙 v0.2 · Aether Constant Universe" },
      { name: "description", content: "Aetherworld 系统级底层常数：数字、五域、引擎权重、阈值、风险、世界、压缩、回验、主体模式、版本、审计与冲突检测。" },
      { property: "og:title", content: "常数宇宙 v0.2" },
      { property: "og:description", content: "跨引擎一致性治理层。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">常数宇宙 · Constant Universe v0.2</h1>
        <p className="text-sm text-muted-foreground">统一注册 · 版本化 · 冲突检测 · Founder Locked · 跨引擎一致性</p>
      </header>
      <ConstantUniversePanel />
    </div>
  ),
});
