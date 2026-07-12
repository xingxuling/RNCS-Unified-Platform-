import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listAllItems, subscribeAetherStore } from "@/lib/store/aetherStoreRuntime";
import { StoreItemCard } from "@/components/store/StoreItemCard";

export const Route = createFileRoute("/store/updates")({
  head: () => ({ meta: [{ title: "更新 · 以太商店" }] }),
  component: UpdatesPage,
});

function UpdatesPage() {
  const [, set] = useState(0);
  useEffect(() => subscribeAetherStore(() => set((n) => n + 1)), []);
  const items = listAllItems().filter((i) => i.status === "UPDATE_AVAILABLE");
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Updates</div>
        <h1 className="text-2xl font-display">更新</h1>
        <p className="text-sm text-muted-foreground">有可用更新的条目。</p>
        <div className="text-[11px]"><Link to="/store" className="text-muted-foreground hover:text-foreground">← 返回商店</Link></div>
      </header>
      {items.length === 0
        ? <div className="text-sm text-muted-foreground border border-dashed border-border/40 rounded p-4">所有条目都是最新版本。</div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((i) => <StoreItemCard key={i.itemId} item={i} />)}
          </div>}
    </div>
  );
}
