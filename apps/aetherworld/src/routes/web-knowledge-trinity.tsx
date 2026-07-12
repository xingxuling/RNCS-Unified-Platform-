import { createFileRoute } from "@tanstack/react-router";
import { WebKnowledgeTrinityPanel } from "@/components/web-knowledge-trinity/WebKnowledgeTrinityPanel";

export const Route = createFileRoute("/web-knowledge-trinity")({
  head: () => ({
    meta: [
      { title: "Web Knowledge Trinity · 以太网页知识三体" },
      { name: "description", content: "WebLKM + WebCM + WebCoM：浏览器本地知识、计算法与常数三层模型，为 WebLCM 与 WebLLM 提供受约束的高层输入。" },
    ],
  }),
  component: () => (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Aether Web Knowledge Trinity Runtime v0.5</h1>
        <p className="text-sm text-muted-foreground">
          以太网页知识三体：WebLKM 检索知识、WebCM 选择计算法、WebCoM 注入常数约束；先知识、再计算、再边界、再概念、最后语言。
        </p>
      </header>
      <WebKnowledgeTrinityPanel />
    </div>
  ),
});
