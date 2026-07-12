import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listCodeRunRecords, type WorkspaceCodeRunRecord } from "@/lib/code-sandbox/codeSandboxWorkspaceBridge";
import { CodeRunHistoryPanel } from "@/components/code-sandbox/CodeRunHistoryPanel";

export const Route = createFileRoute("/code-runs")({
  head: () => ({ meta: [{ title: "Code Runs · 代码运行记录" }, { name: "description", content: "查看 Aether Code Sandbox Bridge 保存的所有代码运行记录。" }] }),
  component: CodeRunsPage,
});

function CodeRunsPage() {
  const [list, setList] = useState<WorkspaceCodeRunRecord[]>([]);
  useEffect(() => setList(listCodeRunRecords()), []);
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Code Runs</div>
        <h1 className="font-display text-2xl gold-text">代码运行记录</h1>
        <p className="text-sm text-muted-foreground">前往 <Link to="/code-sandbox" className="text-primary underline">代码沙箱</Link> 发起新的运行。</p>
      </header>
      <CodeRunHistoryPanel records={list} />
    </div>
  );
}
