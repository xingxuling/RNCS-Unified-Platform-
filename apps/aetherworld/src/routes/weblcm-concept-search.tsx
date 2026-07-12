import { createFileRoute } from "@tanstack/react-router";
import { WebLcmConceptSearchPanel } from "@/components/weblcm/WebLcmConceptSearchPanel";

export const Route = createFileRoute("/weblcm-concept-search")({
  head: () => ({ meta: [{ title: "WebLCM Concept Search · 概念检索" }, { name: "description", content: "在本地概念库中进行关键词 / 向量 / 标签混合检索。" }] }),
  component: () => (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">WebLCM Concept Search · WebLCM 概念检索</h1>
        <p className="text-sm text-muted-foreground">在本地概念库中检索相关概念（关键词 / 标签 / 向量 / 混合）。</p>
      </header>
      <WebLcmConceptSearchPanel />
    </div>
  ),
});
