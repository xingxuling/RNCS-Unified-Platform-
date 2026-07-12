import { createFileRoute, Link } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { getTermById } from "@/lib/vocabulary/vocabularyRegistry";
import { TermDetailPanel } from "@/components/vocabulary/TermDetailPanel";
import { VocabularySafetyNote } from "@/components/vocabulary/VocabularySafetyNote";

export const Route = createFileRoute("/vocabulary-entry")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : "" }),
  head: () => ({ meta: [{ title: "词条详情 — Vocabulary Entry" }] }),
  component: VocabularyEntryPage,
});

function VocabularyEntryPage() {
  const { id } = Route.useSearch();
  const term = getTermById(id);
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      {!term ? (
        <div className="space-y-3">
          <h1 className="text-2xl font-display">未找到词条</h1>
          <p className="text-sm text-muted-foreground">该术语不存在或尚未注册。</p>
          <Link to="/vocabulary" className="text-sm underline">返回词汇百科</Link>
        </div>
      ) : (
        <>
          <TermDetailPanel term={term} />
          <VocabularySafetyNote />
        </>
      )}
    </div>
  );
}
