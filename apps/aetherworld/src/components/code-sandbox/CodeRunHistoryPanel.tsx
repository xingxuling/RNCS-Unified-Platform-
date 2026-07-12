import type { WorkspaceCodeRunRecord } from "@/lib/code-sandbox/codeSandboxWorkspaceBridge";

export function CodeRunHistoryPanel({ records }: { records: WorkspaceCodeRunRecord[] }) {
  if (records.length === 0) {
    return <div className="border border-border/40 rounded p-3 text-[12px] text-muted-foreground">尚无运行记录。</div>;
  }
  return (
    <div className="border border-border/40 rounded">
      <div className="px-3 py-1.5 bg-muted/30 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Run History · 运行历史</div>
      <ul className="divide-y divide-border/30 text-[12px]">
        {records.map((r) => (
          <li key={r.recordId} className="px-3 py-2 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-mono">{r.runId}</div>
              <div className="text-[10px] text-muted-foreground">project: {r.projectId} · runner: {r.runnerMode}</div>
            </div>
            <div className="text-right text-[10px] text-muted-foreground">
              <div>status: {r.status}</div>
              <div>qa: {r.qaStatus} · patches: {r.patchCount}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
