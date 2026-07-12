export interface CoreModelProgressItem { id: string; label: string; status: "pending" | "running" | "done" | "skip" | "error"; note?: string; }

const dot = {
  pending: "bg-muted",
  running: "bg-sky-400 animate-pulse",
  done: "bg-emerald-400",
  skip: "bg-amber-400",
  error: "bg-rose-400",
} as const;

export function CoreModelProgressPanel({ items }: { items: CoreModelProgressItem[] }) {
  return (
    <ol className="space-y-2">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${dot[it.status]}`} />
          <span className="flex-1">{it.label}</span>
          {it.note && <span className="text-[10px] text-muted-foreground">{it.note}</span>}
        </li>
      ))}
    </ol>
  );
}
