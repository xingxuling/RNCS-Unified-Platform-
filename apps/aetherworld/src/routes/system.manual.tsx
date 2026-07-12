// 总说明书 · /system/manual
// Aetherworld v0.1 内部宪法 / 架构总览 / 开发索引。
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  MANUAL_HEADLINE,
  MANUAL_SECTIONS,
  MANUAL_UPDATED_AT,
  MANUAL_VERSION,
  MAIN_PIPELINE_CODE,
  buildHandoffSummary,
  buildSystemOverview,
} from "@/lib/system/aetherSystemManual";

export const Route = createFileRoute("/system/manual")({
  head: () => ({
    meta: [
      { title: "总说明书 — Aetherworld" },
      {
        name: "description",
        content:
          "Aetherworld 总说明书 v0.1：系统总览、主链路、核心系统层、安全边界、路线图与开发接续摘要。",
      },
      { property: "og:title", content: "Aetherworld 总说明书 v0.1" },
      {
        property: "og:description",
        content:
          "数列元智能平台的内部宪法 / 架构总览 / 开发索引 / 安全边界 / 下一轮路线图。",
      },
    ],
  }),
  component: ManualPage,
});

function copy(text: string, label: string) {
  try {
    navigator.clipboard.writeText(text);
    toast.success(`${label} 已复制`);
  } catch {
    toast.error("复制失败");
  }
}

function ManualPage() {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MANUAL_SECTIONS.map((s) => [s.id, true])),
  );

  const toggle = (id: string) =>
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl space-y-6">
      {/* 顶部 */}
      <header className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              System / Aetherworld
            </div>
            <h1 className="text-xl font-semibold">总说明书</h1>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {MANUAL_VERSION} · 更新于 {MANUAL_UPDATED_AT}
            </div>
          </div>
          <Link to="/system" className="text-xs text-primary hover:underline">
            ← 返回系统
          </Link>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90 rounded-lg border border-border/40 bg-card/40 p-4">
          {MANUAL_HEADLINE}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => copy(buildSystemOverview(), "当前系统总览")}
            className="text-xs px-2.5 py-1 rounded border border-border/50 hover:bg-accent/20"
          >
            复制当前系统总览
          </button>
          <button
            onClick={() => copy(buildHandoffSummary(), "开发接续摘要")}
            className="text-xs px-2.5 py-1 rounded border border-border/50 hover:bg-accent/20"
          >
            复制开发接续摘要
          </button>
          <button
            onClick={() => copy(MAIN_PIPELINE_CODE, "系统主链路")}
            className="text-xs px-2.5 py-1 rounded border border-border/50 hover:bg-accent/20"
          >
            复制主链路图
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        {/* 目录 */}
        <nav className="hidden md:block sticky top-4 self-start space-y-1 text-xs">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            目录
          </div>
          {MANUAL_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="block px-2 py-1 rounded hover:bg-accent/20 text-muted-foreground hover:text-foreground"
            >
              {s.title}
            </a>
          ))}
          <a
            href="#handoff-summary"
            className="block px-2 py-1 rounded hover:bg-accent/20 text-muted-foreground hover:text-foreground mt-2 border-t border-border/30 pt-2"
          >
            开发接续摘要
          </a>
        </nav>

        {/* 章节 */}
        <main className="space-y-3 min-w-0">
          {MANUAL_SECTIONS.map((s) => {
            const isOpen = open[s.id] !== false;
            return (
              <section
                key={s.id}
                id={s.id}
                className="rounded-lg border border-border/50 bg-card/40"
              >
                <button
                  onClick={() => toggle(s.id)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium">{s.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {isOpen ? "收起" : "展开"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-2 text-sm">
                    {s.paragraphs?.map((p, i) => (
                      <p
                        key={i}
                        className="text-foreground/85 leading-relaxed"
                      >
                        {p}
                      </p>
                    ))}
                    {s.bullets && (
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {s.bullets.map((b, i) => (
                          <li key={i} className="leading-relaxed">
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                    {s.code && (
                      <pre className="text-[11px] bg-muted/30 border border-border/40 rounded p-3 overflow-auto whitespace-pre">
                        {s.code}
                      </pre>
                    )}
                  </div>
                )}
              </section>
            );
          })}

          {/* 开发接续摘要 */}
          <section
            id="handoff-summary"
            className="rounded-lg border border-primary/30 bg-primary/5"
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium">开发接续摘要</span>
              <button
                onClick={() => copy(buildHandoffSummary(), "开发接续摘要")}
                className="text-xs px-2 py-1 rounded border border-border/50 hover:bg-accent/20"
              >
                复制
              </button>
            </div>
            <pre className="px-4 pb-4 text-[11px] whitespace-pre-wrap leading-relaxed text-foreground/85">
              {buildHandoffSummary()}
            </pre>
          </section>

          <div className="text-[10px] text-muted-foreground text-center pt-4">
            本说明书为 Aetherworld 内部基线文档，仅作展示与开发接续；不构成对外承诺。
          </div>
        </main>
      </div>
    </div>
  );
}
