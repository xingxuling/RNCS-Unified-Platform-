import { createFileRoute, useParams } from "@tanstack/react-router";
import { StoreHomePanel } from "@/components/store/StoreHomePanel";
import { AETHER_STORE_CATEGORIES, getCategoryMeta, type AetherStoreCategoryId } from "@/constants/store/storeCategories";

export const Route = createFileRoute("/store/category/$category")({
  head: () => ({ meta: [{ title: "商店分类 · Aetherworld" }] }),
  component: StoreCategoryPage,
});

function StoreCategoryPage() {
  const { category } = useParams({ from: "/store/category/$category" });
  const valid = AETHER_STORE_CATEGORIES.find((c) => c.id === category);
  const cat = valid ? (category as AetherStoreCategoryId) : "ALL";
  const meta = getCategoryMeta(cat);
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{meta.englishName}</div>
        <h1 className="text-2xl font-display">{meta.chineseName}</h1>
        <p className="text-sm text-muted-foreground">{meta.description}</p>
      </header>
      <StoreHomePanel category={cat} />
    </div>
  );
}
