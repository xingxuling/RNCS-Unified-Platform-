import { createFileRoute } from "@tanstack/react-router";
import { listWorkspaceRecords } from "@/lib/weblcm/webLcmWorkspaceBridge";
import { useState } from "react";

function AuditPage() {
  const [records] = useState(() => listWorkspaceRecords().slice().reverse());
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">WebLCM Audit · WebLCM 审计</h1>
        <p className="text-sm text-muted-foreground">查看 WebLCM 运行记录、QA 结果与运行模式（最近 50 次）。</p>
      </header>
      {records.length === 0 ? (
        <div className="rounded border border-border/40 p-6 text-sm text-muted-foreground text-center">尚无运行记录。</div>
      ) : (
        <div className="rounded border border-border/40 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/30">
              <tr className="text-left">
                <th className="p-2">时间</th><th className="p-2">Run</th><th className="p-2">来源</th>
                <th className="p-2">模式</th><th className="p-2">概念</th><th className="p-2">链</th><th className="p-2">图</th><th className="p-2">QA</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.recordId} className="border-t border-border/30">
                  <td className="p-2 text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-2 font-mono">{r.runId.slice(-8)}</td>
                  <td className="p-2">{r.sourceType}</td>
                  <td className="p-2">{r.runtimeMode}</td>
                  <td className="p-2">{r.conceptCount}</td>
                  <td className="p-2">{r.chainCount}</td>
                  <td className="p-2">{r.graphCount}</td>
                  <td className={`p-2 ${r.qaStatus === "BLOCKED" ? "text-red-500" : r.qaStatus === "WARN" ? "text-amber-500" : "text-emerald-500"}`}>{r.qaStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/weblcm-audit")({
  head: () => ({ meta: [{ title: "WebLCM Audit · 审计" }, { name: "description", content: "Aether WebLCM Runtime 运行审计与 QA 状态。" }] }),
  component: AuditPage,
});
