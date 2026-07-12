import { createFileRoute } from "@tanstack/react-router";
import { AppRuntimePanel } from "@/components/app-runtime/AppRuntimePanel";

export const Route = createFileRoute("/app-runtime")({
  head: () => ({
    meta: [
      { title: "Aether App Runtime · 应用运行时" },
      { name: "description", content: "从一个 App 想法生成需求、架构、文件树、代码草案、HTML 预览、QA 报告和外部开发工具交接包。" },
    ],
  }),
  component: () => (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Aether App Runtime · v0.1</div>
        <h1 className="font-display text-2xl gold-text">应用运行时</h1>
        <p className="text-sm text-muted-foreground">把用户输入的应用想法转化为可保存、可预览、可导出、可继续交给 Codex / Cursor / Lovable 开发的 App 项目对象。</p>
      </header>
      <AppRuntimePanel />
    </div>
  ),
});
