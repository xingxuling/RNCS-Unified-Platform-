import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { VocabularyRegistryTable } from "@/components/vocabulary/VocabularyRegistryTable";
import { VocabularySafetyNote } from "@/components/vocabulary/VocabularySafetyNote";

export const Route = createFileRoute("/vocabulary-categories")({
  validateSearch: (s: Record<string, unknown>) => ({
    category: typeof s.category === "string" ? s.category : "ALL",
  }),
  head: () => ({ meta: [{ title: "词汇分类 — Vocabulary Categories" }] }),
  component: () => (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">词汇分类</h1>
        <p className="text-sm text-muted-foreground mt-1">按分类、系统层、成熟度筛选 Aetherworld 词条。</p>
      </header>
      <VocabularyRegistryTable />
      <VocabularySafetyNote />
    </div>
  ),
});
