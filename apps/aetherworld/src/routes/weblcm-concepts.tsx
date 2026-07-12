import { createFileRoute } from "@tanstack/react-router";
import { listWorkspaceConcepts } from "@/lib/weblcm/webLcmWorkspaceBridge";
import { useState } from "react";

function ConceptsPage() {
  const [concepts] = useState(() => listWorkspaceConcepts());
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">WebLCM Concepts · WebLCM 概念库</h1>
        <p className="text-sm text-muted-foreground">浏览 Workspace 中保存的概念对象（最近 200 条）。</p>
      </header>
      {concepts.length === 0 ? (
        <div className="rounded border border-border/40 p-6 text-sm text-muted-foreground text-center">
          概念库为空。请先在 WebLCM Runtime 页面运行一次概念抽取。
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {concepts.slice().reverse().map(c => (
            <div key={c.conceptId} className="rounded border border-border/40 p-3 text-xs space-y-1">
              <div className="font-semibold">{c.title}</div>
              <div className="text-muted-foreground">[{c.conceptType}] · {c.sourceType} · {c.abstractionLevel}</div>
              <div className="text-muted-foreground">{c.summary}</div>
              <div className="flex flex-wrap gap-1">
                {c.keywords.map(k => <span key={k} className="px-1.5 py-0.5 rounded bg-muted/40 text-[10px]">{k}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/weblcm-concepts")({
  head: () => ({ meta: [{ title: "WebLCM Concepts · WebLCM 概念库" }, { name: "description", content: "浏览本地保存的 Aether 概念对象。" }] }),
  component: ConceptsPage,
});
