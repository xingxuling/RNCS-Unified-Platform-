import { listRuns } from "@/lib/command-canvas/runPanelEngine";
import { RUN_PANEL_STATUS_COLOR } from "@/constants/command-canvas/runPanelStatuses";

interface Props { onSelect?: (runId: string) => void; }

export function AetherRunsPanel({ onSelect }: Props) {
  const runs = listRuns().slice(0, 30);
  return (
    <div className="rounded-lg border border-border/50 bg-card/30">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <h2 className="text-sm font-medium">运行面板 · Runs</h2>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">共 {runs.length} 条</span>
      </div>
      <div className="max-h-[260px] overflow-auto">
        {runs.length === 0 && <div className="p-4 text-xs text-muted-foreground">暂无运行记录。</div>}
        <ul className="divide-y divide-border/30">
          {runs.map((r) => (
            <li
              key={r.runId}
              onClick={() => onSelect?.(r.runId)}
              className="cursor-pointer px-3 py-2 hover:bg-background/40"
            >
              <div className="flex items-center justify-between">
                <div className="truncate text-xs text-foreground">{r.title}</div>
                <span className={`text-[10px] uppercase tracking-wider ${RUN_PANEL_STATUS_COLOR[r.status]}`}>
                  {r.status}
                </span>
              </div>
              <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {r.runType} · {r.summary}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
