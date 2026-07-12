// /system/project-fusion · 项目融合工作台
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  runProjectFusionPipeline,
  buildWorkspaceReportDraft,
  buildSchedulerTaskDrafts,
} from "@/lib/project-fusion/projectFusionRuntime";
import type { ProjectFusionScanReport } from "@/lib/project-fusion/projectFusionTypes";

export const Route = createFileRoute("/system/project-fusion")({
  head: () => ({
    meta: [
      { title: "项目融合 · Aetherworld" },
      { name: "description", content: "扫描、识别、对比、桥接同账号项目可复用资产到 Aetherworld。" },
    ],
  }),
  component: ProjectFusionPage,
});

const PRESET = `AI Chat 项目：包含 chat / agent / 工具调用 / streaming
Workspace 项目：包含 object / version / 项目管理
Calendar 项目：包含 schedule / trigger / 热力图
Store 项目：包含 plugin / capability / webxxm
Analytics 项目：包含 dashboard / metric / 时间序列
LLM Provider 项目：包含 ollama / provider / 本地模型`;

function ProjectFusionPage() {
  const [input, setInput] = useState(PRESET);
  const [report, setReport] = useState<ProjectFusionScanReport | null>(null);

  const runScan = () => {
    const inputs = input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [name, ...rest] = l.split(/[:：]/);
        return { projectName: (name || l).trim(), description: (rest.join(":") || l).trim() };
      });
    setReport(runProjectFusionPipeline(inputs, { apply: false }));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">System / Project Fusion</div>
        <h1 className="text-2xl font-semibold">项目融合工作台（手动登记 · 开发期）</h1>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200/90 leading-relaxed max-w-3xl">
          本页面展示 <b>Lovable 开发期</b> 参考同账号项目后生成的融合报告。
          <b>Aetherworld 运行时不会直接读取你的 Lovable 账号项目。</b>
          想查看真实的 Lovable 同账号扫描结果，请前往 <a className="underline" href="/system/lovable-pass">/system/lovable-pass</a>。
          下方仅用于"手动登记候选项目 → 生成 Bridge Plan"的离线工具，不代表已扫描你的账号。
        </div>
        <p className="text-xs text-muted-foreground max-w-3xl">
          不自动迁移高风险逻辑（Auth / Payment / DB schema / 外部 API），不引入敏感信息。
        </p>
      </header>

      <section className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">候选项目（每行一个：名称：描述）</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full min-h-[160px] rounded-md border border-border/50 bg-background p-2 text-sm font-mono"
        />
        <div className="flex gap-2">
          <button
            onClick={runScan}
            className="rounded-md border border-sky-500/50 text-sky-500 px-3 py-1.5 text-xs hover:bg-sky-500/10"
          >
            扫描并生成融合计划
          </button>
        </div>
      </section>

      {report && (
        <section className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">扫描摘要</div>
            <div className="text-sm">
              共 {report.candidates.length} 候选；可直接复用{" "}
              {report.plans.filter((p) => p.riskLevel === "LOW").length} 项；
              需 Bridge Plan {report.plans.filter((p) => p.riskLevel !== "LOW").length} 项。
            </div>
            {report.warnings.length > 0 && (
              <div className="text-xs text-amber-500 space-y-0.5">
                {report.warnings.map((w, i) => (
                  <div key={i}>· {w}</div>
                ))}
              </div>
            )}
          </div>

          {report.plans.map((p, i) => {
            const c = report.candidates[i];
            const r = report.results[i];
            return (
              <div key={p.id} className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm font-medium">{c.projectName}</div>
                  <div className="flex gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                      {c.projectType}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-sky-500/40 text-sky-500">
                      {p.fusionType}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                      {p.recommendedPriority}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                      {r.status}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">目标系统：{p.targetSystems.join(" / ")}</div>
                {p.conflicts.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-amber-500">冲突 {p.conflicts.length} 条</summary>
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      {p.conflicts.map((c, j) => <li key={j}>· {c}</li>)}
                    </ul>
                  </details>
                )}
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">步骤 / 文件草案</summary>
                  <div className="mt-1 space-y-0.5 text-muted-foreground">
                    {p.steps.map((s, j) => <div key={j}>· {s}</div>)}
                    {p.filesToCreate.map((f, j) => <div key={`c${j}`} className="text-emerald-500">+ {f}</div>)}
                  </div>
                </details>
              </div>
            );
          })}

          <details className="rounded-xl border border-border/40 bg-muted/10 p-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer">Workspace 草案 / Scheduler 任务草案</summary>
            <pre className="mt-2 whitespace-pre-wrap text-[10px]">
{JSON.stringify({
  workspace: buildWorkspaceReportDraft(report),
  scheduler: buildSchedulerTaskDrafts(report),
}, null, 2)}
            </pre>
          </details>
        </section>
      )}
    </div>
  );
}
