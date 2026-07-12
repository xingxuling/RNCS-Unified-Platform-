import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WebCmPanel } from "@/components/web-knowledge-trinity/WebCmPanel";
import { WebCalculusRoutePanel } from "@/components/web-knowledge-trinity/WebCalculusRoutePanel";
import { WebKnowledgeSafetyNote } from "@/components/web-knowledge-trinity/WebKnowledgeSafetyNote";
import { runWebCm, type WebCmRunResult } from "@/lib/web-knowledge-trinity/webcm/webCmRuntime";

function Inner() {
  const [intent, setIntent] = useState("");
  const [result, setResult] = useState<WebCmRunResult | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded border border-border/40 p-3 space-y-2 text-xs">
        <input value={intent} onChange={(e) => setIntent(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && intent.trim()) setResult(runWebCm(intent)); }}
          placeholder="输入意图，例如：缺什么 / 修复 bug / 做一个网页 / 写歌"
          className="w-full px-2 py-1.5 rounded border border-border/40 bg-background" />
        <button onClick={() => intent.trim() && setResult(runWebCm(intent))}
          className="px-3 py-1.5 rounded border border-border/40 hover:bg-muted/30">选择计算法</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WebCmPanel result={result ?? undefined} />
        <WebCalculusRoutePanel result={result ?? undefined} />
      </div>
      <WebKnowledgeSafetyNote />
    </div>
  );
}

export const Route = createFileRoute("/webcm-runtime")({
  head: () => ({
    meta: [
      { title: "WebCM Runtime · 网页计算法模型" },
      { name: "description", content: "WebCM：计算法索引、选择、组合、路由与执行计划。" },
    ],
  }),
  component: () => (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">WebCM Runtime · 网页计算法模型</h1>
        <p className="text-sm text-muted-foreground">
          WebCM 根据用户意图与对象类型，选择并组合计算法，生成执行路线和计划，将结构传给 WebLCM、约束传给 WebLLM。
        </p>
      </header>
      <Inner />
    </div>
  ),
});
