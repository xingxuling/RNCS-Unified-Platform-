import type { EventSelection } from "@/lib/eventAlgorithmEngine";

export function EventPriorityMatrix({ selection }: { selection: EventSelection }) {
  const rows: { label: string; color: string; items: typeof selection.background }[] = [
    { label: "主事件", color: "border-primary/40 bg-primary/5", items: [selection.primary] },
    { label: "副事件", color: "border-amber-500/30 bg-amber-500/5", items: selection.secondary },
    { label: "风险事件", color: "border-red-500/30 bg-red-500/5", items: selection.risk ? [selection.risk] : [] },
    { label: "背景事件", color: "border-border bg-secondary/20", items: selection.background },
  ];
  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Event Priority Matrix · 事件优先级矩阵
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className={`rounded-md border p-3 ${r.color}`}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.label}</div>
            {r.items.length === 0 ? (
              <div className="text-xs text-muted-foreground mt-1">无</div>
            ) : (
              <ul className="mt-1 space-y-1">
                {r.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-foreground">{it.event.name}</span>
                    <span className="text-muted-foreground">· {it.event.en}</span>
                    <span className="ml-auto font-mono text-muted-foreground">{it.score}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
