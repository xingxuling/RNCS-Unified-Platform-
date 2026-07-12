import { createFileRoute } from "@tanstack/react-router";
import { runMissingLayerDetection } from "@/lib/missing-layer/missingLayerDetectionCalculus";
import { MissingLayerCard } from "@/components/missing-layer/MissingLayerCard";
import { MissingLayerQaPanel } from "@/components/missing-layer/MissingLayerQaPanel";
import { listMissingLayerExamples } from "@/lib/missing-layer/missingLayerExamplesRegistry";

function Page() {
  const result = runMissingLayerDetection();
  const examples = listMissingLayerExamples();
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Missing-Layer Audit</div>
        <h1 className="font-display text-2xl gold-text">缺层审计</h1>
        <p className="text-sm text-muted-foreground">逐条审计当前系统缺层、严重度与建议修复方式。</p>
      </header>
      <MissingLayerQaPanel result={result} />
      <div className="aether-card p-4 space-y-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">缺层条目</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {result.missingLayers.map(i => (<MissingLayerCard key={i.issueId} issue={i} />))}
        </div>
      </div>
      <div className="aether-card p-4 space-y-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">预置示例</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {examples.map(e => (
            <div key={e.exampleId} className="border border-border/40 rounded p-2">
              <div className="font-medium">{e.title}</div>
              <div className="text-muted-foreground">{e.problem}</div>
              <div className="text-[10px] text-primary/80 mt-1">→ {e.recommendation}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/missing-layer-audit")({
  head: () => ({ meta: [{ title: "Missing-Layer Audit · 缺层审计" }, { name: "description", content: "Aetherworld 系统缺层审计。" }] }),
  component: Page,
});
