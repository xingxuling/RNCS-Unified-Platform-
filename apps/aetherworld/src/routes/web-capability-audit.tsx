import { createFileRoute } from "@tanstack/react-router";
import { listCapabilityWorkspaceRecords } from "@/lib/web-capability/webCapabilityWorkspaceBridge";
import { listWebCapabilityRuns } from "@/lib/web-capability/webCapabilityRunner";

export const Route = createFileRoute("/web-capability-audit")({
  head: () => ({ meta: [{ title: "Web Capability Audit · 能力模型审计" }] }),
  component: function AuditPage() {
    const records = listCapabilityWorkspaceRecords();
    const runs = listWebCapabilityRuns();
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-semibold">能力模型审计</h1>
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-sm font-semibold mb-2">Workspace 记录（{records.length}）</h2>
          {records.length === 0 ? (
            <div className="text-xs text-muted-foreground">暂无记录。请到 /web-capabilities 运行能力模型。</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr><th className="text-left p-1">RecordId</th><th className="text-left p-1">Capability</th><th className="text-left p-1">Task</th><th className="text-left p-1">Outputs</th><th className="text-left p-1">QA</th><th className="text-left p-1">CreatedAt</th></tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.recordId} className="border-t">
                    <td className="p-1 font-mono">{r.recordId}</td>
                    <td className="p-1 font-mono">{r.capabilityId}</td>
                    <td className="p-1 truncate max-w-[280px]" title={r.userTask}>{r.userTask}</td>
                    <td className="p-1">{r.outputCount}</td>
                    <td className="p-1">{r.qaStatus}</td>
                    <td className="p-1">{r.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-sm font-semibold mb-2">最近运行明细（{runs.length}）</h2>
          <ul className="text-xs space-y-1">
            {runs.slice(0, 10).map((r) => (
              <li key={r.runId}>
                <span className="font-mono">{r.runId}</span> · {r.capabilityId} · QA={r.qaStatus} · outputs={r.outputs.length}
                {r.blocked && <span className="text-rose-600"> · BLOCKED：{r.blockedReasons?.join("; ")}</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  },
});
