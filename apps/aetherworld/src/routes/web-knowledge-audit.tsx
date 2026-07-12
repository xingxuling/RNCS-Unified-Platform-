import { createFileRoute } from "@tanstack/react-router";
import { listWebKnowledgeTrinityRuns } from "@/lib/web-knowledge-trinity/aetherWebKnowledgeTrinityRuntime";
import { listWebLkmRecords } from "@/lib/web-knowledge-trinity/weblkm/webLkmWorkspaceBridge";
import { listWebCmRecords } from "@/lib/web-knowledge-trinity/webcm/webCmWorkspaceBridge";
import { listWebCoMRecords } from "@/lib/web-knowledge-trinity/webcom/webCoMWorkspaceBridge";

function Inner() {
  const runs = listWebKnowledgeTrinityRuns();
  const lkm = listWebLkmRecords();
  const cm = listWebCmRecords();
  const com = listWebCoMRecords();
  return (
    <div className="space-y-4 text-xs">
      <Section title={`Trinity Runs (${runs.length})`}>
        {runs.length === 0 && <div className="text-muted-foreground">暂无运行记录。</div>}
        {runs.slice(0, 30).map((r) => (
          <div key={r.runId} className="rounded border border-border/30 p-2">
            <div className="font-mono text-[10px] text-amber-400">{r.runId}</div>
            <div>意图：{r.userIntent}</div>
            <div className="text-muted-foreground">
              {r.finalOutputSummary} · QA {r.qaStatus} · {new Date(r.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </Section>
      <Section title={`WebLKM Events (${lkm.length})`}>
        {lkm.slice(0, 20).map((r) => (
          <div key={r.id} className="text-[10px] font-mono">
            [{r.createdAt.slice(11, 19)}] {r.type} · {r.runId}
          </div>
        ))}
      </Section>
      <Section title={`WebCM Routes (${cm.length})`}>
        {cm.slice(0, 20).map((r) => (
          <div key={r.id} className="text-[10px] font-mono">
            [{r.createdAt.slice(11, 19)}] {r.routeId}
          </div>
        ))}
      </Section>
      <Section title={`WebCoM Bundles (${com.length})`}>
        {com.slice(0, 20).map((r) => (
          <div key={r.id} className="text-[10px] font-mono">
            [{r.createdAt.slice(11, 19)}] {r.bundleId}
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-border/40 p-3">
      <div className="font-semibold mb-2">{title}</div>
      <div className="space-y-1.5 max-h-72 overflow-y-auto">{children}</div>
    </div>
  );
}

export const Route = createFileRoute("/web-knowledge-audit")({
  head: () => ({
    meta: [
      { title: "Web Knowledge Audit · 网页知识审计" },
      { name: "description", content: "查看 WebLKM/WebCM/WebCoM 与三体运行的 Workspace 审计记录。" },
    ],
  }),
  component: () => (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Web Knowledge Audit · 网页知识审计</h1>
        <p className="text-sm text-muted-foreground">所有运行记录保存在本地 Workspace，可被 Recalculation 与 QA 复检。</p>
      </header>
      <Inner />
    </div>
  ),
});
