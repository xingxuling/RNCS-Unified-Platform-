import type { WebCapabilityOutput } from "@/lib/web-capability/aetherWebCapabilityModels";

export function WebCapabilityOutputPanel({ outputs }: { outputs: WebCapabilityOutput[] }) {
  if (outputs.length === 0) {
    return (
      <section className="rounded-lg border bg-card p-4 text-xs text-muted-foreground">
        暂无输出对象（可能被 Safety Guard 阻断或尚未运行）。
      </section>
    );
  }
  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">输出对象 · Output Objects</h3>
      <div className="space-y-3">
        {outputs.map((o) => (
          <div key={o.outputId} className="rounded border p-3 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{o.title}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{o.outputType}</span>
            </div>
            <div className="text-muted-foreground">{o.summary}</div>
            <div className="text-[10px] text-muted-foreground">导出目标：{o.exportTargets.join(" · ")}</div>
            <ul className="text-[10px] text-amber-600 dark:text-amber-400 list-disc list-inside">
              {o.safetyNotes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
