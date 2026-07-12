import { createFileRoute } from "@tanstack/react-router";
import { WebKnowledgeSearchPanel } from "@/components/web-knowledge-trinity/WebKnowledgeSearchPanel";

export const Route = createFileRoute("/web-knowledge-search")({
  head: () => ({
    meta: [
      { title: "Web Knowledge Search · 网页知识检索" },
      { name: "description", content: "在 WebLKM 本地知识库中检索 Aetherworld 内部知识。" },
    ],
  }),
  component: () => (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Web Knowledge Search · 网页知识检索</h1>
        <p className="text-sm text-muted-foreground">
          支持关键词检索、标签检索、对象关联检索与版本感知检索。混合检索为默认模式。
        </p>
      </header>
      <WebKnowledgeSearchPanel />
    </div>
  ),
});
