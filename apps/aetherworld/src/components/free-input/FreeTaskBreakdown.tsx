import type { FreeTask } from "@/lib/free-input/freeTaskSplitter";

export function FreeTaskBreakdown({ tasks }: { tasks: FreeTask[] }) {
  if (!tasks.length) return null;
  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-3 text-xs space-y-1.5">
      <div className="uppercase tracking-wider text-muted-foreground">任务拆分</div>
      <ol className="space-y-1">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-start gap-2">
            <span className="text-muted-foreground shrink-0">#{t.priority}</span>
            <span className="px-1.5 rounded bg-primary/10 text-primary text-[10px]">{t.taskIntent}</span>
            <span className="truncate" title={t.inputSlice}>{t.inputSlice}</span>
            <span className="ml-auto text-muted-foreground shrink-0">→ {t.targetEngine}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
