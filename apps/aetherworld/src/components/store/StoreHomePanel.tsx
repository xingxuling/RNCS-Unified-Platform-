import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  listAllItems, listByCategory, listInstalledItems,
  listNeedsAttention, searchItems, subscribeAetherStore,
} from "@/lib/store/aetherStoreRuntime";
import type { AetherStoreItem } from "@/lib/store/aetherStoreTypes";
import { StoreItemCard } from "./StoreItemCard";
import { StoreCategoryTabs } from "./StoreCategoryTabs";
import { StoreSidebarFilters } from "./StoreSidebarFilters";
import { StoreHeroSection } from "./StoreHeroSection";
import type { AetherStoreCategoryId } from "@/constants/store/storeCategories";
import { getCategoryMeta } from "@/constants/store/storeCategories";
import {
  applyStoreFilters, DEFAULT_FILTER_STATE, getSourceGroup,
  type StoreFilterState, type StoreSourceGroup,
} from "@/lib/store/storeSourceMapping";

interface Props { category: AetherStoreCategoryId }

/**
 * Aether Store 首页 · 应用商店式布局
 * - 顶部：搜索 + 入口（上传 / 我的 / 私有 / 已安装 / 更新 / 发布中心）
 * - 分类 Tabs（横向）
 * - Hero 精选区
 * - 左侧筛选 + 右侧分组（精选 / 内部 / 外部 / 用户 / 待处理 / 已安装）
 */
export function StoreHomePanel({ category }: Props) {
  const [, setTick] = useState(0);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<StoreFilterState>(DEFAULT_FILTER_STATE);
  const [filterOpen, setFilterOpen] = useState(false);
  useEffect(() => subscribeAetherStore(() => setTick((n) => n + 1)), []);

  const cat = getCategoryMeta(category);
  const base = category === "ALL" ? listAllItems() : listByCategory(category);
  const searched = q.trim() ? searchItems(q).filter((i) => category === "ALL" || i.category === category) : base;
  const filtered: AetherStoreItem[] = useMemo(() => applyStoreFilters(searched, filter), [searched, filter]);

  // 来源分组（用于侧栏计数与板块）
  const bySource = useMemo(() => {
    const map: Record<StoreSourceGroup, AetherStoreItem[]> = { INTERNAL: [], EXTERNAL: [], USER: [] };
    listAllItems().forEach((i) => map[getSourceGroup(i.source)].push(i));
    return map;
  }, []);

  const showSections = category === "ALL" && !q.trim() && filter.source === "ALL"
    && filter.risk === "ALL" && filter.qa === "ALL" && filter.price === "ALL" && filter.installable === "ALL";

  // 精选 / 推荐 / 待处理 / 已安装
  const allItems = listAllItems();
  const featured = allItems.filter((i) =>
    ["cap-web-code-m", "model-webllm", "model-weblcm", "model-weblkm"].includes(i.itemId),
  );
  const fallbackFeatured = featured.length === 0 ? allItems.slice(0, 4) : featured;
  const installed = listInstalledItems().slice(0, 6);
  const needs = listNeedsAttention().slice(0, 6);
  const newest = [...allItems].sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1)).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索能力、模型、世界、模板、Prompt、Agent……"
            className="flex-1 bg-card/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
          />
          <Link
            to="/system/user-assets"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2"
          >
            上传资产
          </Link>
        </div>

        {/* 入口胶囊条 — 应用宝风格 */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <EntryChip to="/store" label="首页" />
          <EntryChip to="/store/installed" label="已安装" />
          <EntryChip to="/store/updates" label="更新" />
          <EntryChip to="/store/private" label="私有商店" />
          <EntryChip to="/store/my-assets" label="我的资产" />
          <EntryChip to="/system/user-assets" label="上传出售" />
          <EntryChip to="/system/capability-assets" label="能力资产" />
          <EntryChip to="/store/publisher" label="发布中心" />
          <EntryChip to="/store/transactions" label="交易记录" />
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="ml-auto lg:hidden text-[11px] rounded-full border border-border/50 px-2.5 py-1 text-muted-foreground hover:text-foreground"
          >
            筛选
          </button>
        </div>
      </div>

      <StoreCategoryTabs active={category} />

      {/* Hero 区 */}
      {showSections && <StoreHeroSection featured={fallbackFeatured} />}

      {/* 主区：左筛选 + 右内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
        <div className={`${filterOpen ? "block" : "hidden"} lg:block`}>
          <StoreSidebarFilters
            value={filter}
            onChange={setFilter}
            counts={{ total: allItems.length, bySource: {
              INTERNAL: bySource.INTERNAL.length,
              EXTERNAL: bySource.EXTERNAL.length,
              USER: bySource.USER.length,
            }}}
          />
        </div>

        <div className="min-w-0 space-y-8">
          {showSections ? (
            <>
              <Section title="内部能力 · 官方系统与引擎" subtitle="Aetherworld 自研系统、引擎、Agent、训练工具。">
                <Grid items={bySource.INTERNAL.slice(0, 6)} empty="暂无内部能力。" />
              </Section>
              <Section title="外部能力 · 开源与第三方" subtitle="开源工具、API、模型 Provider、第三方适配器。">
                <Grid items={bySource.EXTERNAL.slice(0, 6)} empty="尚未接入外部能力。" />
              </Section>
              <Section title="用户能力 · 创作者与上传" subtitle="用户在 Aetherworld 中创建或上传的资产。">
                <Grid items={bySource.USER.slice(0, 6)} empty="尚无用户创作。前往「上传出售」开始。" />
              </Section>
              <Section title="最近更新" subtitle="按最近更新时间排序。">
                <Grid items={newest} empty="—" />
              </Section>
              <Section title="需要处理" subtitle="待安装、待启用、可更新或异常。">
                <Grid items={needs} empty="目前没有需要处理的条目。" />
              </Section>
              <Section title="已安装" subtitle="当前工作区可用的条目。">
                <Grid items={installed} empty="尚未安装任何条目。" />
              </Section>
            </>
          ) : (
            <Section
              title={`${cat.chineseName}（${filtered.length}/${searched.length}）`}
              subtitle={q.trim() ? `搜索：${q}` : cat.description}
            >
              <Grid items={filtered} empty="未找到匹配条目。请调整筛选或搜索关键字。" />
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function EntryChip({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-full border border-border/40 px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-border"
    >
      {label}
    </Link>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-display">{title}</h2>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Grid({ items, empty }: { items: AetherStoreItem[]; empty: string }) {
  if (items.length === 0) {
    return <div className="text-xs text-muted-foreground border border-dashed border-border/40 rounded p-4">{empty}</div>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {items.map((i) => <StoreItemCard key={i.itemId} item={i} />)}
    </div>
  );
}
