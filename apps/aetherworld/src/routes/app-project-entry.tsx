import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app-project-entry")({
  head: () => ({ meta: [{ title: "App Project Entry · 应用项目详情" }, { name: "description", content: "查看与编辑单个 App Project 详情。" }] }),
  component: () => (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">App Project Entry</div>
        <h1 className="font-display text-2xl gold-text">应用项目详情</h1>
      </header>
      <div className="border border-border/40 rounded p-4 text-sm text-muted-foreground space-y-2">
        <p>v0.1 阶段：App Project 仅在浏览器本地 Workspace 中保存为草案。请前往 <Link to="/app-runtime" className="text-primary underline">应用运行时</Link> 生成项目，或前往 <Link to="/app-projects" className="text-primary underline">应用项目列表</Link> 查看记录概览。</p>
        <p>后续版本将在此提供：版本切换、文件编辑、重生成代码、生成 Handoff Pack、CLM 评审与归档操作。</p>
      </div>
    </div>
  ),
});
