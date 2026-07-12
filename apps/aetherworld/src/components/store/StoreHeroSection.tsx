import { Link } from "@tanstack/react-router";
import type { AetherStoreItem } from "@/lib/store/aetherStoreTypes";

interface Props { featured: AetherStoreItem[] }

/**
 * 商店首页 Hero — 精选 / 今日推荐
 * 大卡片 + 旁边小卡片，参考 Microsoft Store / 应用宝。
 */
export function StoreHeroSection({ featured }: Props) {
  if (featured.length === 0) return null;
  const main = featured[0];
  const rest = featured.slice(1, 4);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-5 gap-3">
      <HeroBig item={main} />
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
        {rest.map((i) => <HeroSmall key={i.itemId} item={i} />)}
      </div>
    </section>
  );
}

function HeroBig({ item }: { item: AetherStoreItem }) {
  return (
    <Link
      to="/store/item/$id"
      params={{ id: item.itemId }}
      className="lg:col-span-3 relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/20 via-primary/5 to-background p-6 sm:p-8 min-h-[200px] flex flex-col justify-between hover:border-border transition-colors"
    >
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="text-[10px] uppercase tracking-[0.3em] text-primary/80">今日精选 · Featured</div>
        <h2 className="text-2xl sm:text-3xl font-display mt-2">{item.chineseName}</h2>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-3 max-w-xl">{item.description}</p>
      </div>
      <div className="relative flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{item.author} · v{item.version}</span>
        <span className="text-primary hover:underline">查看详情 →</span>
      </div>
    </Link>
  );
}

function HeroSmall({ item }: { item: AetherStoreItem }) {
  return (
    <Link
      to="/store/item/$id"
      params={{ id: item.itemId }}
      className="rounded-xl border border-border/50 bg-card/40 p-3 flex flex-col gap-1.5 hover:border-border transition-colors"
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">推荐</div>
      <h3 className="text-sm font-display truncate">{item.chineseName}</h3>
      <p className="text-[11px] text-muted-foreground line-clamp-2">{item.description}</p>
    </Link>
  );
}
