import { useState } from "react";
import { runFullStaleSweep } from "@/lib/text-dynamic/textDynamicUpdateEngine";

export function TextStalePanel() {
  const [result, setResult] = useState(() => runFullStaleSweep());
  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="font-display text-lg">过期文本 · Stale Text</h2>
        <button onClick={() => setResult(runFullStaleSweep())}
          className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90">
          重新检测
        </button>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Metric label="stale 总数" value={result.staleCount} />
        <Metric label="CRITICAL 条目" value={result.criticalStaleItems.length} />
        <Metric label="涉及 scope" value={Object.keys(result.staleByScope).length} />
        <Metric label="建议数" value={result.suggestedActions.length} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-1">建议</h3>
        <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
          {result.suggestedActions.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>
      <div className="text-xs text-muted-foreground">
        Stale by scope: {Object.entries(result.staleByScope).map(([k, v]) => `${k}=${v}`).join(" · ") || "—"}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-display">{value}</div>
    </div>
  );
}
