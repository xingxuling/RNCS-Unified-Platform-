import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { listInstalledItems, listAllItems, subscribeAetherStore } from "@/lib/store/aetherStoreRuntime";
import { listFavorites, subscribeStoreRegistry } from "@/lib/store/aetherStoreRegistry";
import { StoreItemCard } from "@/components/store/StoreItemCard";

export const Route = createFileRoute("/store/my-assets")({
  head: () => ({ meta: [{ title: "我的资产 · 以太商店" }] }),
  component: MyAssetsPage,
});

function MyAssetsPage() {
  const { user } = useAuth();
  const [, set] = useState(0);
  useEffect(() => subscribeAetherStore(() => set((n) => n + 1)), []);
  useEffect(() => subscribeStoreRegistry(() => set((n) => n + 1)), []);
  const installed = listInstalledItems();
  const all = listAllItems();
  const fav = listFavorites();
  const favorites = all.filter((i) => fav.includes(i.itemId));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">My Assets</div>
        <h1 className="text-2xl font-display">我的资产</h1>
        <p className="text-sm text-muted-foreground">已安装、收藏、已购买与下载历史。</p>
        <div className="text-[11px]"><Link to="/store" className="text-muted-foreground hover:text-foreground">← 返回商店</Link></div>
      </header>

      {!user && (
        <div className="text-sm text-muted-foreground border border-dashed border-border/40 rounded p-4">
          登录后可管理你的资产并跨设备同步。
          <Link to="/login" className="ml-2 text-primary hover:underline">前往登录</Link>
        </div>
      )}

      <Section title={`已安装（${installed.length}）`}>
        {installed.length === 0 ? <Empty text="尚未安装任何条目。" /> :
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {installed.map((i) => <StoreItemCard key={i.itemId} item={i} />)}
          </div>}
      </Section>

      <Section title={`收藏（${favorites.length}）`}>
        {favorites.length === 0 ? <Empty text="尚未收藏条目。" /> :
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {favorites.map((i) => <StoreItemCard key={i.itemId} item={i} />)}
          </div>}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-2"><h2 className="text-sm font-display">{title}</h2>{children}</section>;
}
function Empty({ text }: { text: string }) {
  return <div className="text-xs text-muted-foreground border border-dashed border-border/40 rounded p-3">{text}</div>;
}
