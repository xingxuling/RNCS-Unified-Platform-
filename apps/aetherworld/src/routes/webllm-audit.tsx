import { createFileRoute } from "@tanstack/react-router";
import { listWebLlmWorkspaceRecords } from "@/lib/webllm/webLlmWorkspaceBridge";

export const Route = createFileRoute("/webllm-audit")({
  head: () => ({
    meta: [
      { title: "WebLLM Audit · WebLLM 审计" },
      { name: "description", content: "WebLLM 运行记录、降级记录、QA 状态。" },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const list = listWebLlmWorkspaceRecords();
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">WebLLM Audit</h1>
        <p className="text-sm text-muted-foreground">所有 WebLLM 运行均保存到本地 Workspace，可审计、可回退。</p>
      </header>
      {list.length === 0 ? (
        <div className="border border-border/40 rounded p-6 text-sm text-muted-foreground text-center">
          暂无运行记录。请在 WebLLM Runtime 页面运行一次。
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((r) => (
            <div key={r.recordId} className="border border-border/40 rounded p-3 text-[12px] grid grid-cols-2 gap-1">
              <div><span className="text-muted-foreground">recordId</span> <span className="font-mono">{r.recordId}</span></div>
              <div><span className="text-muted-foreground">runId</span> <span className="font-mono">{r.runId}</span></div>
              <div><span className="text-muted-foreground">model</span> <span className="font-mono">{r.modelId}</span></div>
              <div><span className="text-muted-foreground">task</span> <span className="font-mono">{r.taskType}</span></div>
              <div><span className="text-muted-foreground">mode</span> <span className="font-mono">{r.runtimeMode}</span></div>
              <div><span className="text-muted-foreground">neuro</span> <span className="font-mono">{r.neuroControlProfile}</span></div>
              <div><span className="text-muted-foreground">status</span> <span className="font-mono">{r.status}</span></div>
              <div><span className="text-muted-foreground">qa</span> <span className="font-mono">{r.qaStatus}</span></div>
              <div><span className="text-muted-foreground">fallback</span> <span className="font-mono">{String(r.fallbackUsed)}</span></div>
              <div><span className="text-muted-foreground">createdAt</span> <span className="font-mono">{r.createdAt}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
