import { createFileRoute } from "@tanstack/react-router";
import { WebLkmPanel } from "@/components/web-knowledge-trinity/WebLkmPanel";
import { WebKnowledgeSearchPanel } from "@/components/web-knowledge-trinity/WebKnowledgeSearchPanel";
import { WebKnowledgeSafetyNote } from "@/components/web-knowledge-trinity/WebKnowledgeSafetyNote";

export const Route = createFileRoute("/weblkm-runtime")({
  head: () => ({
    meta: [
      { title: "WebLKM Runtime · 网页本地知识模型" },
      { name: "description", content: "WebLKM：本地知识索引、检索、版本、证据链与过期检测。" },
    ],
  }),
  component: () => (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">WebLKM Runtime · 网页本地知识模型</h1>
        <p className="text-sm text-muted-foreground">
          WebLKM 收集 Aetherworld 内部知识、建立本地索引并维护版本与证据链，为 WebCM、WebCoM、WebLCM、WebLLM 提供摘要而不是原文倾倒。
        </p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WebLkmPanel />
        <div className="space-y-4">
          <div className="rounded border border-border/40 p-3">
            <div className="text-sm font-semibold mb-2">知识检索</div>
            <WebKnowledgeSearchPanel />
          </div>
          <WebKnowledgeSafetyNote />
        </div>
      </div>
    </div>
  ),
});
