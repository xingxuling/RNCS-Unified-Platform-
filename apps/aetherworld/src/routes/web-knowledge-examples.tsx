import { createFileRoute, Link } from "@tanstack/react-router";
import { WEB_KNOWLEDGE_EXAMPLES } from "@/lib/web-knowledge-trinity/webKnowledgeExamplesRegistry";

export const Route = createFileRoute("/web-knowledge-examples")({
  head: () => ({
    meta: [
      { title: "Web Knowledge Examples · 网页知识示例" },
      { name: "description", content: "WebLKM/WebCM/WebCoM 三体的预置示例。" },
    ],
  }),
  component: () => (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Web Knowledge Examples · 网页知识示例</h1>
        <p className="text-sm text-muted-foreground">
          复制示例意图到 <Link to="/web-knowledge-trinity" className="text-amber-400 underline">三体运行页</Link> 即可观察 WebLKM → WebCM → WebCoM 全链路。
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {WEB_KNOWLEDGE_EXAMPLES.map((ex) => (
          <div key={ex.id} className="rounded border border-border/40 p-3 text-xs">
            <div className="font-semibold mb-1">{ex.title}</div>
            <div className="text-muted-foreground mb-1">{ex.description}</div>
            <div className="font-mono text-[10px] mt-2 px-2 py-1 rounded bg-muted/30">{ex.intent}</div>
          </div>
        ))}
      </div>
    </div>
  ),
});
