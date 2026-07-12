import { graphSummary, buildDependencyGraph } from "@/lib/text-dynamic/textDependencyGraph";

export function TextDependencyGraphPanel() {
  const summary = graphSummary();
  const sample = buildDependencyGraph().slice(0, 30);
  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="font-display text-lg">文本依赖图 · Dependency Graph</h2>
      <div className="text-sm text-muted-foreground">
        共 {summary.totalDependencies} 条依赖关系。
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {Object.entries(summary.byType).map(([k, v]) => (
          <div key={k} className="rounded border border-border px-2 py-1 bg-muted/30">
            <span className="text-muted-foreground">{k}</span> · <span className="font-medium">{v}</span>
          </div>
        ))}
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">查看依赖样本（前 30 条）</summary>
        <ul className="mt-2 space-y-1 font-mono">
          {sample.map((d, i) => (
            <li key={i}>{d.sourceType} · {d.sourceId} → {d.textId} （强度 {d.dependencyStrength}）</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
