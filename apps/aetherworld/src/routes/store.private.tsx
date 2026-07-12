import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { listAllItems, subscribeAetherStore } from "@/lib/store/aetherStoreRuntime";
import { listPrivateLikeItems } from "@/lib/store/storeSourceMapping";
import { StoreItemCard } from "@/components/store/StoreItemCard";

export const Route = createFileRoute("/store/private")({
  head: () => ({ meta: [{ title: "私有商店 · 以太商店" }] }),
  component: PrivateStorePage,
});

function PrivateStorePage() {
  const [, setTick] = useState(0);
  useEffect(() => subscribeAetherStore(() => setTick((n) => n + 1)), []);

  const all = listAllItems();
  const items = listPrivateLikeItems(all);

  const groups = {
    LOCAL: items.filter((i) => i.source === "LOCAL"),
    COMMUNITY: items.filter((i) => i.source === "COMMUNITY"),
    FOUNDER_ONLY: items.filter((i) => i.source === "FOUNDER_ONLY"),
    REVIEW: items.filter((i) => i.status === "BROKEN"),
    BLOCKED: items.filter((i) => i.status === "BLOCKED"),
    ARCHIVED: items.filter((i) => i.status === "UNINSTALLED"),
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-display">私有商店</h1>
          <p className="text-xs text-muted-foreground mt-1">
            草案、私有上架、安装预览、待审核与已阻断的能力包。本视图不公开，不会触发真实发布。
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/system/user-assets" className="text-xs rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5">
            上传新资产
          </Link>
          <Link to="/store" className="text-xs rounded border border-border/50 hover:border-border text-muted-foreground hover:text-foreground px-3 py-1.5">
            返回公开商店
          </Link>
        </div>
      </header>

      <Group title="本地草案 · LOCAL" subtitle="本机创建、尚未提交审核的能力包。" items={groups.LOCAL} />
      <Group title="社区与用户上架 · COMMUNITY" subtitle="用户自上传或社区贡献。" items={groups.COMMUNITY} />
      <Group title="创始人专享 · FOUNDER_ONLY" subtitle="内部专享，未公开能力包。" items={groups.FOUNDER_ONLY} />
      <Group title="需要审核 · NEEDS_REVIEW" subtitle="QA 不通过或异常的条目。" items={groups.REVIEW} />
      <Group title="已阻断 · BLOCKED" subtitle="存在安全风险或政策违规的条目。" items={groups.BLOCKED} />
      <Group title="已归档 · ARCHIVED" subtitle="卸载后保留的条目。" items={groups.ARCHIVED} />

      <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-4">
        私有商店仅作管理视图；高风险能力不会自动安装，需经安装预览与人工确认。
      </p>
    </div>
  );
}

function Group({ title, subtitle, items }: { title: string; subtitle: string; items: ReturnType<typeof listAllItems> }) {
  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-display">{title}（{items.length}）</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      {items.length === 0
        ? <div className="text-xs text-muted-foreground border border-dashed border-border/40 rounded p-3">暂无条目。</div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {items.map((i) => <StoreItemCard key={i.itemId} item={i} compact />)}
          </div>}
    </section>
  );
}
