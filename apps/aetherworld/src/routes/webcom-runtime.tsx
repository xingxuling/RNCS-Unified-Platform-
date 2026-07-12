import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WebCoMPanel } from "@/components/web-knowledge-trinity/WebCoMPanel";
import { WebConstantConstraintPanel } from "@/components/web-knowledge-trinity/WebConstantConstraintPanel";
import { WebKnowledgeGraphPanel } from "@/components/web-knowledge-trinity/WebKnowledgeGraphPanel";
import { WebKnowledgeSafetyNote } from "@/components/web-knowledge-trinity/WebKnowledgeSafetyNote";
import { runWebCoM, type WebCoMRunResult } from "@/lib/web-knowledge-trinity/webcom/webCoMRuntime";

function Inner() {
  const [intent, setIntent] = useState("");
  const [output, setOutput] = useState("");
  const [result, setResult] = useState<WebCoMRunResult | null>(null);
  function run() {
    if (!intent.trim()) return;
    setResult(runWebCoM({ userIntent: intent, outputDraftText: output || intent }));
  }
  return (
    <div className="space-y-4">
      <div className="rounded border border-border/40 p-3 space-y-2 text-xs">
        <input value={intent} onChange={(e) => setIntent(e.target.value)}
          placeholder="任务意图，例如：运行一段构建脚本"
          className="w-full px-2 py-1.5 rounded border border-border/40 bg-background" />
        <textarea value={output} onChange={(e) => setOutput(e.target.value)} rows={2}
          placeholder="可选：输出草稿，用于检测违背（例如 rm -rf /）"
          className="w-full px-2 py-1.5 rounded border border-border/40 bg-background resize-none" />
        <button onClick={run} className="px-3 py-1.5 rounded border border-border/40 hover:bg-muted/30">生成约束包</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WebCoMPanel result={result ?? undefined} />
        <WebConstantConstraintPanel result={result ?? undefined} />
      </div>
      <div className="rounded border border-border/40 p-3">
        <div className="text-sm font-semibold mb-2">常数图谱</div>
        <WebKnowledgeGraphPanel />
      </div>
      <WebKnowledgeSafetyNote />
    </div>
  );
}

export const Route = createFileRoute("/webcom-runtime")({
  head: () => ({
    meta: [
      { title: "WebCoM Runtime · 网页常数模型" },
      { name: "description", content: "WebCoM：常数索引、不变量、约束注入、边界守卫与违背检测。" },
    ],
  }),
  component: () => (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">WebCoM Runtime · 网页常数模型</h1>
        <p className="text-sm text-muted-foreground">
          WebCoM 把常数宇宙的不变量、边界与禁忌注入到每一次运行，为 WebLCM 提供概念边界，为 WebLLM 提供禁止越界规则。
        </p>
      </header>
      <Inner />
    </div>
  ),
});
