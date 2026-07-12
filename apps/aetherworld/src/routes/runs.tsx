import { createFileRoute } from "@tanstack/react-router";
import { listRuns } from "@/lib/command-canvas/runPanelEngine";
import { RUN_PANEL_STATUS_COLOR } from "@/constants/command-canvas/runPanelStatuses";

export const Route = createFileRoute("/runs")({
  head: () => ({ meta: [{ title: "运行 · Aetherworld" }] }),
  component: RunsPage,
});

function RunsPage() {
  const runs = listRuns();
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Runs</div>
          <h1 className="text-2xl font-display">运行</h1>
          <p className="text-sm text-muted-foreground">所有指令、能力与运行时的执行记录。</p>
        </header>
        <div className="aether-card divide-y divide-border/40">
          {runs.length === 0 && (
            <div className="p-6 text-xs text-muted-foreground text-center">暂无运行记录。</div>
          )}
          {runs.map((r) => (
            <div key={r.runId} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm truncate">{r.title}</div>
                <div className="text-[11px] text-muted-foreground truncate">{r.runType} · {r.summary}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-[11px] ${RUN_PANEL_STATUS_COLOR[r.status]}`}>{r.status}</div>
                <div className="text-[10px] text-muted-foreground">
                  {new Date(r.startedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
