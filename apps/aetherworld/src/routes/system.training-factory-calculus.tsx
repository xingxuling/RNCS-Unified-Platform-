// 训练工厂计算法 · 工作台
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { runTrainingFactoryCalculus } from "@/lib/training-factory/trainingFactoryRuntime";
import {
  TFC_SAFETY_ALLOWED,
  TFC_SAFETY_FORBIDDEN,
} from "@/lib/training-factory/trainingFactorySafetyPolicy";

export const Route = createFileRoute("/system/training-factory-calculus")({
  head: () => ({
    meta: [
      { title: "训练工厂计算法 · Aether Training Factory Calculus" },
      {
        name: "description",
        content:
          "把语料种子编译成模型血统的 15 步计算法：四象补法、AetherSeed 血统线、递归自举、成本计算法、数据权重计算法、下一代计划。",
      },
    ],
  }),
  component: TrainingFactoryCalculusPage,
});

function locLabel(loc: string): string {
  if (loc === "LOCAL_PC") return "本机";
  if (loc === "GPU_SERVER") return "服务器";
  return "混合";
}

function TrainingFactoryCalculusPage() {
  const report = useMemo(() => runTrainingFactoryCalculus(), []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Aether Training Factory Calculus v0.1
        </div>
        <h1 className="text-2xl font-semibold">训练工厂计算法</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          模型训练工厂不只是页面，而是一种把语料种子编译成模型血统的计算法。
          它由 15 步流程、四象补法、AetherSeed 血统线、递归自举、成本计算法、数据权重计算法与下一代计划构成。
          Aetherworld 不会自动执行训练 / 上传数据 / 调用外部服务器。
        </p>
      </header>

      {/* 1. 计算法总览 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">1. 计算法总览</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          {[
            { k: "流程步骤", v: report.calculusFlow.length },
            { k: "血统线", v: report.bloodline.length },
            { k: "数据集草案", v: report.datasetVersions.length },
            { k: "训练实验", v: report.experiments.length },
            { k: "评测计划", v: report.evalPlans.length },
            { k: "Provider 接入", v: report.providerImportPlans.length },
            { k: "成本样例", v: report.costSamples.length },
            { k: "数据权重样例", v: report.weightSamples.length },
          ].map((c) => (
            <div
              key={c.k}
              className="rounded-md border border-border/40 bg-muted/10 p-2 text-center"
            >
              <div className="text-muted-foreground">{c.k}</div>
              <div className="text-lg text-foreground/90">{c.v}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-foreground/85">{report.summary}</p>
      </section>

      {/* 2. 15 步流程 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">2. 流程图（15 步）</h2>
        <div className="space-y-1.5">
          {report.calculusFlow.map((s, i) => (
            <div
              key={s.id}
              className="rounded-md border border-border/40 bg-muted/10 p-2 text-[11px]"
            >
              <div className="text-foreground/90">
                <span className="text-muted-foreground mr-1">{i + 1}.</span>
                {s.name}
              </div>
              <div className="text-muted-foreground text-[10px]">{s.description}</div>
              <div className="text-muted-foreground text-[10px]">
                输出：{s.outputs.join("、")}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 四象补法 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">3. 四象补法（Skeleton / Muscle / Blood / Nerve）</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
          {report.quadrants.map((q) => (
            <div
              key={q.quadrant}
              className="rounded-md border border-border/40 bg-muted/10 p-3"
            >
              <div className="text-foreground/90 mb-1">{q.label}</div>
              <ul className="text-[10px] text-foreground/85 space-y-0.5">
                {q.items.map((it) => (
                  <li key={it.id}>
                    · <span className="text-foreground/90">{it.name}</span>
                    <span className="text-muted-foreground"> — {it.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 4. AetherSeed 血统线 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">4. AetherSeed 血统线</h2>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {report.bloodline.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md border border-border/60 text-foreground/90">
                {s.modelName}
                <span className="text-muted-foreground"> · {locLabel(s.forgeLocation)}</span>
              </span>
              {i < report.bloodline.length - 1 && (
                <span className="text-muted-foreground">→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 5. 递归自举 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">5. 递归自举（每代如何反哺训练工厂）</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
          {report.recursivePlan.map((s) => (
            <div
              key={s.bloodlineStageId}
              className="rounded-md border border-border/40 bg-muted/10 p-2"
            >
              <div className="text-foreground/90">{s.modelName}</div>
              <div className="text-muted-foreground text-[10px]">
                反哺能力：{s.feedbackCapabilities.join("、")}
              </div>
              <div className="text-muted-foreground text-[10px]">
                反哺目标：{s.feedbackTargets.join("、")}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. 成本计算法 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">6. 成本计算法（TrainingCostCalculus）</h2>
        <p className="text-[11px] text-muted-foreground">
          Cost = GPU/电费 + 注意力切换 + 数据污染风险 + 失败重训成本
          − 自动化复用收益 − 血统积累收益 − 本机慢跑收益。
        </p>
        <div className="space-y-1.5">
          {report.costSamples.map((c) => (
            <div
              key={c.experimentId}
              className="rounded-md border border-border/40 bg-muted/10 p-2 text-[10px] space-y-0.5"
            >
              <div className="text-foreground/90">
                {c.experimentId} · 推荐炉火：{locLabel(c.recommendedForgeMode)}
              </div>
              <div className="text-muted-foreground">
                金钱 ≈ ¥{c.moneyCost} · 时间 {c.timeCost}h · 注意力 {c.attentionCost}/10 ·
                风险 {c.riskCost}/10 · 血统价值 {c.bloodlineValue}/10 ·
                复用价值 {c.reuseValue}/10 · 本机慢跑价值 {c.localSlowValue}/10
              </div>
              {c.notes.map((n, i) => (
                <div key={i} className="text-muted-foreground">· {n}</div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* 7. 数据权重计算法 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">7. 数据权重计算法（DatasetWeightCalculus）</h2>
        <p className="text-[11px] text-muted-foreground">
          按 sourceType / importance / verifiedScore / reuseCount / modelImprovementEvidence /
          safetyStatus / freshness / uniqueness / alignment 计算 datasetWeight，
          供后续 DatasetMixture 与 Reweighting。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="text-muted-foreground border-b border-border/40">
                <th className="text-left py-1 pr-2">来源</th>
                <th className="text-left py-1 pr-2">importance</th>
                <th className="text-left py-1 pr-2">verified</th>
                <th className="text-left py-1 pr-2">reuse</th>
                <th className="text-left py-1 pr-2">improve</th>
                <th className="text-left py-1 pr-2">safety</th>
                <th className="text-left py-1 pr-2">fresh</th>
                <th className="text-left py-1 pr-2">unique</th>
                <th className="text-left py-1 pr-2">align</th>
                <th className="text-left py-1 pr-2 text-foreground/90">weight</th>
              </tr>
            </thead>
            <tbody>
              {report.weightSamples.map((w) => (
                <tr key={w.sampleSource} className="border-b border-border/20">
                  <td className="py-1 pr-2 text-foreground/90">{w.sampleSource}</td>
                  <td className="py-1 pr-2">{w.importance}</td>
                  <td className="py-1 pr-2">{w.verifiedScore}</td>
                  <td className="py-1 pr-2">{w.reuseCount}</td>
                  <td className="py-1 pr-2">{w.modelImprovementEvidence}</td>
                  <td className="py-1 pr-2">{w.safetyStatus}</td>
                  <td className="py-1 pr-2">{w.freshness}</td>
                  <td className="py-1 pr-2">{w.uniqueness}</td>
                  <td className="py-1 pr-2">{w.alignmentWithAetherSeedGoal}</td>
                  <td className="py-1 pr-2 text-foreground/90">{w.datasetWeight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 8. 数据集 / 配方 / 实验 / 评测 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">8. 数据集 / 配方 / 实验 / 评测（草案）</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
          <div className="rounded-md border border-border/40 bg-muted/10 p-2">
            <div className="text-muted-foreground mb-1">数据集 DatasetVersion</div>
            {report.datasetVersions.map((d) => (
              <div key={d.id} className="border-t border-border/30 pt-1 mt-1 first:border-0 first:pt-0 first:mt-0">
                <div className="text-foreground/90">{d.name} · {d.versionTag}</div>
                <div className="text-muted-foreground">{d.description}</div>
                <div className="text-muted-foreground">
                  来源：{d.sampleSources.join("、")} · ≈ {d.estimatedSampleCount} 条
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-md border border-border/40 bg-muted/10 p-2">
            <div className="text-muted-foreground mb-1">训练配方 TrainingRecipe</div>
            {report.recipes.map((r) => (
              <div key={r.id} className="border-t border-border/30 pt-1 mt-1 first:border-0 first:pt-0 first:mt-0">
                <div className="text-foreground/90">{r.name}</div>
                <div className="text-muted-foreground">
                  方法 {r.method} · 基座 {r.baseModel} · {locLabel(r.forgeLocation)} · {r.estimatedDuration}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-md border border-border/40 bg-muted/10 p-2">
            <div className="text-muted-foreground mb-1">训练实验 ExperimentPlan</div>
            {report.experiments.map((e) => (
              <div key={e.id} className="border-t border-border/30 pt-1 mt-1 first:border-0 first:pt-0 first:mt-0">
                <div className="text-foreground/90">{e.name}</div>
                <div className="text-muted-foreground">
                  目标：{e.goal} · 状态 {e.status} · 下一步：{e.nextStep}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-md border border-border/40 bg-muted/10 p-2">
            <div className="text-muted-foreground mb-1">评测计划 EvalPlan</div>
            {report.evalPlans.map((p) => (
              <div key={p.id} className="border-t border-border/30 pt-1 mt-1 first:border-0 first:pt-0 first:mt-0">
                <div className="text-foreground/90">{p.name}</div>
                <div className="text-muted-foreground">
                  指标：{p.items.map((i) => i.name).join("、")}
                </div>
                <div className="text-muted-foreground">通过标准：{p.passCriteria}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Provider 接入计划 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">9. Provider 接入计划（仅手动执行）</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
          {report.providerImportPlans.map((p) => (
            <div key={p.id} className="rounded-md border border-border/40 bg-muted/10 p-2">
              <div className="text-foreground/90">
                {p.targetModelId} → {p.provider}
              </div>
              <ol className="list-decimal list-inside text-muted-foreground space-y-0.5 mt-1">
                {p.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* 10. 下一代计划 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">10. 下一代模型计划（NextGenerationPlan）</h2>
        <div className="space-y-1.5">
          {report.nextGenerationPlans.map((p) => (
            <div
              key={`${p.fromBloodlineStageId}-${p.toBloodlineStageId}`}
              className="rounded-md border border-border/40 bg-muted/10 p-2 text-[11px]"
            >
              <div className="text-foreground/90">
                {p.fromBloodlineStageId} → {p.toBloodlineStageId}
              </div>
              <div className="text-muted-foreground text-[10px]">
                依据：{p.reason}
              </div>
              <div className="text-muted-foreground text-[10px]">
                依赖：{p.dependsOn.join("、")} · 预计：{p.estimatedCalendar}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 11. 安全边界 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">11. 安全边界</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-2">
            <div className="text-emerald-500 mb-1">允许</div>
            <ul className="list-disc list-inside space-y-0.5 text-foreground/85">
              {TFC_SAFETY_ALLOWED.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-rose-500/40 bg-rose-500/5 p-2">
            <div className="text-rose-500 mb-1">禁止</div>
            <ul className="list-disc list-inside space-y-0.5 text-foreground/85">
              {TFC_SAFETY_FORBIDDEN.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
