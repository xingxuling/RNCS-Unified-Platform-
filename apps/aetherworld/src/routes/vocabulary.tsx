import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { VocabularyHomePanel } from "@/components/vocabulary/VocabularyHomePanel";
import { VocabularySearchBox } from "@/components/vocabulary/VocabularySearchBox";
import { VocabularySafetyNote } from "@/components/vocabulary/VocabularySafetyNote";

export const Route = createFileRoute("/vocabulary")({
  head: () => ({
    meta: [
      { title: "词汇百科 — Aetherworld Vocabulary Encyclopedia" },
      { name: "description", content: "Aetherworld 系统术语、数列术语、计算法术语、世界引擎术语与治理术语的统一百科。" },
    ],
  }),
  component: VocabularyPage,
});

function VocabularyPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">Aetherworld Vocabulary Encyclopedia</h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理 Aetherworld 的系统术语、数列术语、计算法术语、世界引擎术语、治理术语、教程术语和安全边界术语。
        </p>
      </header>
      <VocabularyHomePanel />
      <VocabularySearchBox />
      <VocabularySafetyNote />
    </div>
  );
}
