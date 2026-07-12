import type { CodeRunLog } from "@/lib/code-sandbox/codeRunRequestEngine";

const LEVEL_COLOR: Record<string, string> = {
  INFO: "text-muted-foreground",
  WARN: "text-amber-300",
  ERROR: "text-red-400",
  SYSTEM: "text-sky-300",
};

export function CodeRunLogPanel({ logs }: { logs: CodeRunLog[] }) {
  return (
    <div className="border border-border/40 rounded">
      <div className="px-3 py-1.5 bg-muted/30 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Run Log · 运行日志</div>
      <div className="p-3 max-h-72 overflow-auto font-mono text-[11px] space-y-0.5">
        {logs.length === 0 && <div className="text-muted-foreground">（暂无日志）</div>}
        {logs.map((l) => (
          <div key={l.logId} className="flex gap-2">
            <span className="text-muted-foreground/60 shrink-0">[{l.level}]</span>
            <span className={LEVEL_COLOR[l.level] || ""}>{l.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
