import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/code-run-entry")({
  head: () => ({ meta: [{ title: "Code Run Entry · 代码运行详情" }, { name: "description", content: "查看某次代码运行的请求、日志、错误摘要、修复建议、Patch 草案与 QA 结果。" }] }),
  component: () => (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Code Run Entry</div>
        <h1 className="font-display text-2xl gold-text">代码运行详情</h1>
      </header>
      <div className="border border-border/40 rounded p-4 text-sm text-muted-foreground space-y-2">
        <p>v0.2 阶段：单次代码运行详情可在 <Link to="/code-sandbox" className="text-primary underline">代码沙箱</Link> 页面运行后直接查看。完整的运行历史可在 <Link to="/code-runs" className="text-primary underline">代码运行记录</Link> 中浏览。</p>
        <p>后续版本将在此提供：日志重放、Patch 应用预览、Codex/Cursor 修复包下载、QA 复检与 Workspace 操作。</p>
      </div>
    </div>
  ),
});
