import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listAppWorkspaceRecords, type WorkspaceAppProjectRecord } from "@/lib/app-runtime/appWorkspaceBridge";

export const Route = createFileRoute("/app-projects")({
  head: () => ({ meta: [{ title: "App Projects · 应用项目" }, { name: "description", content: "查看 Aether App Runtime 已保存的应用项目。" }] }),
  component: AppProjectsPage,
});

function AppProjectsPage() {
  const [list, setList] = useState<WorkspaceAppProjectRecord[]>([]);
  useEffect(() => setList(listAppWorkspaceRecords()), []);
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">App Projects</div>
        <h1 className="font-display text-2xl gold-text">应用项目</h1>
        <p className="text-sm text-muted-foreground">本地 Workspace 中保存的所有 App Project 草案。</p>
      </header>
      {list.length === 0 ? (
        <div className="border border-border/40 rounded p-6 text-center text-sm text-muted-foreground">
          尚无项目。请先到 <Link to="/app-runtime" className="text-primary underline">应用运行时</Link> 生成一个。
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map(r => (
            <li key={r.recordId} className="border border-border/40 rounded p-3 space-y-1">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">{r.projectName}</div>
                <span className="text-[10px] uppercase text-muted-foreground">{r.appType}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">{r.summary}</div>
              <div className="text-[10px] text-muted-foreground flex flex-wrap gap-3">
                <span>files {r.fileCount}</span>
                <span>status {r.status}</span>
                <span>qa {r.qaStatus}</span>
                <span>export {r.exportTargets.join(", ") || "—"}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
