// /system/imaginative-fusion · 畅想融合工作台
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { runImaginativeFusionPipeline, type ImaginativePipelineOutput } from "@/lib/imaginative-fusion/imaginativeFusionRuntime";
import { buildAgentReview } from "@/lib/imaginative-fusion/imaginativeFusionAgentBridge";

export const Route = createFileRoute("/system/imaginative-fusion")({
  head: () => ({
    meta: [
      { title: "畅想融合 · Aetherworld" },
      { name: "description", content: "把同账号项目的概念跨域组合，生成 Aetherworld 下一批高潜力模块创意。" },
    ],
  }),
  component: ImaginativeFusionPage,
});

const PRESET = `AI Chat 项目：chat / agent / 工具调用 / streaming
Workspace 项目：object / 工作区 / 版本管理
Calendar 项目：calendar / schedule / trigger
Store 项目：store / plugin / capability / webxxm
Social 项目：social / feed / 社区
World 项目：world / character / 叙事 / 音乐
Sandbox 项目：sandbox / code / runtime
Analytics 项目：analytics / dashboard / 指标
Record 项目：record / audit / 回验
Local Provider 项目：ollama / 本地模型 / gateway
Life OS 项目：personal os / 虚拟生活
Decision 项目：track / decision / 决策`;

const MODE_LABEL: Record<string, string> = {
  PRODUCT_FUSION:  "产品融合",
  WORKFLOW_FUSION: "工作流融合",
  AGENT_FUSION:    "Agent 融合",
  WORLD_FUSION:    "世界融合",
  STORE_FUSION:    "能力包融合",
  BUSINESS_FUSION: "商业融合",
};

function ImaginativeFusionPage() {
  const [input, setInput] = useState(PRESET);
  const [modeFilter, setModeFilter] = useState<string>("ALL");
  const [output, setOutput] = useState<ImaginativePipelineOutput | null>(null);

  const run = () => {
    const inputs = input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [name, ...rest] = l.split(/[:：]/);
        return { projectName: (name || l).trim(), description: (rest.join(":") || l).trim() };
      });
    setOutput(runImaginativeFusionPipeline(inputs));
  };

  const ideas = output
    ? (modeFilter === "ALL"
        ? [...output.report.p0Ideas, ...output.report.p1Ideas, ...output.report.deferredIdeas]
        : [...output.report.topIdeas, ...output.report.p0Ideas, ...output.report.p1Ideas, ...output.report.deferredIdeas]
            .filter((i, idx, arr) => arr.findIndex((x) => x.id === i.id) === idx)
            .filter((i) => i.fusionMode === modeFilter))
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          System / Imaginative Fusion
        </div>
        <h1 className="text-2xl font-semibold">畅想融合工作台</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          把同账号项目的概念、UI 模式、玩法机制、工作流、世界观作为种子，跨域组合出 Aetherworld 下一批模块 / 子产品 / 能力包 / Agent 工具创意。
          本工作台不修改代码、不合并项目、不自动上架。
        </p>
      </header>

      <section className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">项目种子（每行：名称：概念关键词）</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full min-h-[200px] rounded-md border border-border/50 bg-background p-2 text-sm font-mono"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={run}
            className="rounded-md border border-sky-500/50 text-sky-500 px-3 py-1.5 text-xs hover:bg-sky-500/10"
          >
            生成跨项目融合创意
          </button>
          <span className="text-xs text-muted-foreground">按模式筛选：</span>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="rounded-md border border-border/50 bg-background px-2 py-1 text-xs"
          >
            <option value="ALL">全部</option>
            {Object.entries(MODE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </section>

      {output && (
        <>
          <section className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">摘要</div>
            <div className="text-sm">{output.report.summary}</div>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">MSL 帧 / Memory 草案 / Scheduler 任务草案</summary>
              <pre className="mt-2 whitespace-pre-wrap text-[10px] text-muted-foreground">
{JSON.stringify({
  msl: output.msl,
  memoryDrafts: output.memoryDrafts,
  schedulerDrafts: output.schedulerDrafts,
  webxxmPackageIdeas: output.packageIdeas,
}, null, 2)}
              </pre>
            </details>
          </section>

          <section className="space-y-3">
            {ideas.map((i) => (
              <article key={i.id} className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm font-medium">{i.cnTitle}</div>
                  <div className="flex gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                      {MODE_LABEL[i.fusionMode] ?? i.fusionMode}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-sky-500/40 text-sky-500">
                      {i.recommendedPriority}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                      {i.riskLevel}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{i.description}</div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                  <span>价值 {i.potentialValue}</span>
                  <span>难度 {i.implementationDifficulty}</span>
                  <span>契合 {i.strategicFit}</span>
                  <span>新颖 {i.novelty}</span>
                  <span>→ {i.suggestedNextStep}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  目标：{i.targetAetherSystems.join(" / ")}
                </div>
                <details className="text-[11px]">
                  <summary className="cursor-pointer text-muted-foreground">路线图 / Agent 评审</summary>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    {i.roadmap.map((r, idx) => <li key={idx}>· {r}</li>)}
                  </ul>
                  <ul className="mt-2 space-y-0.5 text-muted-foreground">
                    {buildAgentReview(i).map((n, idx) => (
                      <li key={idx}>[{n.agent}] {n.comment}</li>
                    ))}
                  </ul>
                </details>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
