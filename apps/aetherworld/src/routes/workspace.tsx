import { createFileRoute, Link } from "@tanstack/react-router";

const WORKSPACES = [
  { id: "main",  name: "Aether 主工作区", desc: "默认工作区，包含全部模块。", to: "/app-projects" },
  { id: "world", name: "蓝天机世界",      desc: "WebLWM 世界对象工作区。",    to: "/world-runtime" },
  { id: "app",   name: "App Runtime",     desc: "应用构建与预览工作区。",     to: "/app-runtime" },
  { id: "music", name: "声乐工作区",      desc: "声线、AI 音乐提示词。",      to: "/vocal-engine" },
  { id: "story", name: "剧情工作区",      desc: "小说、漫画与任务文本。",     to: "/narrative-engine" },
];

export const Route = createFileRoute("/workspace")({
  head: () => ({ meta: [{ title: "工作区 · Aetherworld" }] }),
  component: () => (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Workspaces</div>
          <h1 className="text-2xl font-display">工作区</h1>
          <p className="text-sm text-muted-foreground">为不同的目标维护独立的对象、运行与审计记录。</p>
        </header>
        <div className="grid sm:grid-cols-2 gap-3">
          {WORKSPACES.map((w) => (
            <Link key={w.id} to={w.to} className="aether-card p-4 hover:border-border transition-colors">
              <div className="text-sm font-medium">{w.name}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{w.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  ),
});
