import { createFileRoute } from "@tanstack/react-router";
import { StoreHomePanel } from "@/components/store/StoreHomePanel";

export const Route = createFileRoute("/store/")({
  head: () => ({ meta: [{ title: "以太商店 · Aetherworld" }] }),
  component: StoreHomePage,
});

function StoreHomePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Aether Store</div>
        <h1 className="text-2xl font-display">以太商店</h1>
        <p className="text-sm text-muted-foreground">
          下载、安装、启用与管理 Aetherworld 的能力、模型、知识、世界、模板、插件与资产。
        </p>
      </header>
      <StoreHomePanel category="ALL" />
    </div>
  );
}
