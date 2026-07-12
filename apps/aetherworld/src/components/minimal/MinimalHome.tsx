import { Link } from "@tanstack/react-router";
import { listRuns } from "@/lib/command-canvas/runPanelEngine";
import { listCanvasObjects } from "@/lib/command-canvas/canvasObjectResolver";
import { AppWindow, Code2, Globe2, Music, Sparkles, Cpu } from "lucide-react";
import { RUN_PANEL_STATUS_COLOR } from "@/constants/command-canvas/runPanelStatuses";

const QUICK = [
  { to: "/app-runtime",    label: "创建应用",      icon: AppWindow },
  { to: "/code-sandbox",   label: "运行代码",      icon: Code2 },
  { to: "/world-runtime",  label: "生成世界",      icon: Globe2 },
  { to: "/vocal-engine",   label: "生成音乐",      icon: Music },
  { to: "/webxxm-store",   label: "打开能力商店",  icon: Sparkles },
  { to: "/real-webllm",    label: "本地语言模型",  icon: Cpu },
] as const;

const RECENT_PROJECTS = [
  { id: "main",  name: "Aether 主工作区", desc: "默认工作区",   to: "/workspace" },
  { id: "world", name: "蓝天机世界",       desc: "世界对象",     to: "/world-runtime" },
  { id: "app",   name: "应用生成器",       desc: "应用项目",     to: "/app-runtime" },
];

export function MinimalHome() {
  const objects = listCanvasObjects().slice(0, 3);
  const runs = listRuns().slice(0, 3);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 pt-20 pb-12 space-y-12">
        <section className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-display">Aetherworld</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            把想法、项目、世界和能力变成可运行的对象。
          </p>
          <p className="text-base pt-4 text-foreground/80">你想让 Aetherworld 做什么？</p>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {QUICK.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="aether-card p-3.5 flex items-center gap-2.5 hover:border-border transition-colors"
            >
              <q.icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{q.label}</span>
            </Link>
          ))}
        </section>

        <section className="space-y-2.5">
          <SectionTitle title="最近项目" more="/projects" />
          <div className="grid sm:grid-cols-3 gap-2.5">
            {RECENT_PROJECTS.map((w) => (
              <Link key={w.id} to={w.to} className="aether-card p-3.5 hover:border-border transition-colors">
                <div className="text-sm">{w.name}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{w.desc}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-2.5">
          <SectionTitle title="最近对象" more="/objects" />
          <div className="aether-card divide-y divide-border/40">
            {objects.length === 0 ? (
              <EmptyRow text="这里还没有对象，从对话框输入目标开始。" />
            ) : (
              objects.map((o) => (
                <Link key={o.id} to="/object-inspector" className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/30">
                  <div className="min-w-0">
                    <div className="text-xs truncate">{o.title}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{o.type}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(o.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="space-y-2.5">
          <SectionTitle title="最近运行" more="/runs" />
          <div className="aether-card divide-y divide-border/40">
            {runs.length === 0 ? (
              <EmptyRow text="这里还没有运行记录。" />
            ) : (
              runs.map((r) => (
                <div key={r.runId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <div className="text-xs truncate">{r.title}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{r.runType}</div>
                  </div>
                  <div className={`text-[10px] shrink-0 ${RUN_PANEL_STATUS_COLOR[r.status]}`}>{r.status}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ title, more }: { title: string; more?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
      {more && (
        <Link to={more} className="text-[10px] text-muted-foreground hover:text-foreground">查看全部 →</Link>
      )}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div className="px-4 py-4 text-[11px] text-muted-foreground">{text}</div>;
}
