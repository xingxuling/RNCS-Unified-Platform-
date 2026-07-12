import { createFileRoute } from "@tanstack/react-router";
import { listKnowledgeSources } from "@/lib/knowledge/knowledgeSourceRegistry";
import { KnowledgeSourceCard } from "@/components/knowledge/KnowledgeSourceCard";
import { KnowledgeSafetyNote } from "@/components/knowledge/KnowledgeSafetyNote";

export const Route = createFileRoute("/knowledge-sources")({
  head: () => ({
    meta: [
      { title: "知识来源 · Knowledge Sources" },
      { name: "description", content: "查看知识来源类型、信任等级与归属。" },
    ],
  }),
  component: KnowledgeSourcesPage,
});

function KnowledgeSourcesPage() {
  const sources = listKnowledgeSources();
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">知识来源</h1>
        <p className="text-sm text-muted-foreground">
          每个来源都有信任、权限与新鲜度规则；标记为「需要引用」的来源在直接引用时必须附带原文。
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sources.map(s => <KnowledgeSourceCard key={s.sourceId} source={s} />)}
      </div>
      <KnowledgeSafetyNote />
    </div>
  );
}
