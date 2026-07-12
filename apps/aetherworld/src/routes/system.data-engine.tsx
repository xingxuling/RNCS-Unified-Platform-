// AetherSeed Data Engine · 数据引擎总控视图 · /system/data-engine
// 只读聚合页：汇总 Intake / Dataset / Export / Local Training 的当前状态，
// 不真正训练、不上传数据、不破坏现有页面。
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  countTrainingSamples,
  listTrainingSamples,
} from "@/lib/aetherseed-dataset/trainingSampleStore";
import {
  countEvalSamples,
  listEvalSamples,
} from "@/lib/aetherseed-dataset/evalSampleStore";
import { listDatasetVersions } from "@/lib/aetherseed-dataset/datasetBuilder";
import { listLocalTrainingBundles, type LocalTrainingBundle } from "@/lib/aetherseed-local-training/localTrainingRuntime";
import { listExperiments } from "@/lib/aetherseed-local-training/localTrainingExperimentStore";
import {
  DATASET_TYPE_LABEL,
  type DatasetSafetyStatus,
} from "@/lib/aetherseed-dataset/datasetTypes";

interface PipelineNode {
  title: string;
  description: string;
  to?: string;
  status: "READY" | "PARTIAL" | "PLANNED";
}

const PIPELINE: PipelineNode[] = [
  { title: "Intake Forge",        description: "粘贴 / 上传 → 清洗 → 去重 → 候选样本",        to: "/system/intake-forge",   status: "READY" },
  { title: "Dataset Builder",     description: "样本归集 → 版本化 → 质量与安全评分",            to: "/system/datasets",       status: "READY" },
  { title: "Real Export",         description: "TXT / JSONL / ChatML / Alpaca / Manifest 导出", to: "/system/datasets",       status: "READY" },
  { title: "Local Training Runner", description: "本机训练计划与脚本草案",                       to: "/system/local-training", status: "READY" },
  { title: "Experiment Ledger",   description: "训练实验账本与结果对比",                         to: "/system/experiment-ledger", status: "READY" },
  { title: "Auto Training Executor", description: "受控自动训练（白名单 + dry-run + 用户确认）", to: "/system/auto-training", status: "READY" },
  { title: "Training Workflow Orchestrator", description: "把全部环节编排为完整训练工作流", to: "/system/training-workflows", status: "READY" },
  { title: "First Run Readiness", description: "第一炉训练前检查清单（数据/导出/计划/网关/确认）", to: "/system/first-run-readiness", status: "READY" },
  { title: "Model Importer",      description: "训练产物导入个人模型铸造工坊",                   to: "/system/personal-model-forge", status: "PLANNED" },
];

const STATUS_COLORS: Record<DatasetSafetyStatus, string> = {
  PASS:  "text-emerald-300",
  WARN:  "text-amber-300",
  BLOCK: "text-rose-300",
};

const PIPELINE_BADGE: Record<PipelineNode["status"], string> = {
  READY:   "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  PARTIAL: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  PLANNED: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
};

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-md border border-border bg-card/40 px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function DataEnginePage() {
  const samples = listTrainingSamples();
  const evals = listEvalSamples();
  const datasets = listDatasetVersions();
  const plans = listLocalTrainingBundles();
  const experiments = listExperiments();

  const stats = useMemo(() => {
    const block = samples.filter((s) => s.safetyStatus === "BLOCK").length
      + evals.filter((e) => e.safetyStatus === "BLOCK").length;
    const warn = samples.filter((s) => s.safetyStatus === "WARN").length
      + evals.filter((e) => e.safetyStatus === "WARN").length;
    const avgQuality = samples.length
      ? samples.reduce((a, s) => a + (s.qualityScore ?? 0), 0) / samples.length
      : 0;
    const exportArtifacts = datasets.reduce((a, d) => a + (d.defaultExportFormats?.length ?? 0), 0);
    return {
      trainingCount: countTrainingSamples(),
      evalCount: countEvalSamples(),
      datasetCount: datasets.length,
      exportArtifacts,
      planCount: plans.length,
      experimentCount: experiments.length,
      block,
      warn,
      avgQuality,
    };
  }, [samples, evals, datasets, plans, experiments]);

  const recentDatasets = useMemo(
    () => [...datasets].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6),
    [datasets],
  );
  const recentSamples = useMemo(
    () => [...samples].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6),
    [samples],
  );

  const exportFormats = ["TXT", "JSONL", "ChatML", "Alpaca", "Manifest", "Safety Report"];

  const nextSteps: Array<{ text: string; to?: string }> = [
    { text: "生成更多训练样本（Intake Forge 投喂）", to: "/system/intake-forge" },
    { text: "构建数据集新版本并导出训练包",            to: "/system/datasets" },
    { text: "为最新数据集生成本机训练计划",            to: "/system/local-training" },
    { text: "进入第一炉训练准备清单（点火前检查）", to: "/system/first-run-readiness" },
    { text: "接入模型导入器，将训练产物导入工坊（规划中）", to: "/system/personal-model-forge" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">AetherSeed · Data Engine</div>
        <h1 className="text-2xl font-semibold">数据引擎</h1>
        <p className="text-sm text-muted-foreground">
          AetherSeed 训练数据流的总控视图：从投喂、归集、版本化、导出到本机训练的端到端总览。本页为只读聚合，所有写操作请在对应子页面执行。
        </p>
      </header>

      <Section title="数据流水线">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PIPELINE.map((node, i) => {
            const inner = (
              <div className="h-full rounded-md border border-border bg-card/40 p-4 transition hover:border-primary/40">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">步骤 {i + 1}</div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${PIPELINE_BADGE[node.status]}`}>
                    {node.status === "READY" ? "已就绪" : node.status === "PARTIAL" ? "部分完成" : "规划中"}
                  </span>
                </div>
                <div className="text-sm font-medium">{node.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{node.description}</div>
              </div>
            );
            return node.to ? (
              <Link key={node.title} to={node.to} className="block">{inner}</Link>
            ) : (
              <div key={node.title}>{inner}</div>
            );
          })}
        </div>
      </Section>

      <Section title="总览">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Stat label="训练样本"      value={stats.trainingCount} />
          <Stat label="评测样本"      value={stats.evalCount} />
          <Stat label="数据集版本"    value={stats.datasetCount} />
          <Stat label="导出制品（格式条目）" value={stats.exportArtifacts} />
          <Stat label="本机训练计划草案" value={stats.planCount} />
          <Stat label="训练实验"      value={stats.experimentCount} />
          <Stat label="BLOCK 样本"    value={stats.block} tone={stats.block ? "text-rose-300" : undefined} />
          <Stat label="WARN 样本"     value={stats.warn}  tone={stats.warn  ? "text-amber-300" : undefined} />
          <Stat label="平均质量分"    value={stats.avgQuality.toFixed(2)} />
        </div>
      </Section>

      <Section title="最近数据集">
        {recentDatasets.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-card/30 px-4 py-6 text-sm text-muted-foreground">
            暂无数据集。请前往
            <Link to="/system/datasets" className="mx-1 underline">数据集</Link>
            构建第一个版本。
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">名称</th>
                  <th className="px-3 py-2">版本</th>
                  <th className="px-3 py-2">类型</th>
                  <th className="px-3 py-2">样本数</th>
                  <th className="px-3 py-2">质量</th>
                  <th className="px-3 py-2">安全</th>
                </tr>
              </thead>
              <tbody>
                {recentDatasets.map((d) => (
                  <tr key={d.id} className="border-t border-border/60">
                    <td className="px-3 py-2">{d.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">{d.version}</td>
                    <td className="px-3 py-2 text-xs">{DATASET_TYPE_LABEL[d.datasetType] ?? d.datasetType}</td>
                    <td className="px-3 py-2">{d.sampleCount}</td>
                    <td className="px-3 py-2">{(d.qualityScore ?? 0).toFixed(2)}</td>
                    <td className={`px-3 py-2 text-xs ${STATUS_COLORS[d.safetyStatus]}`}>{d.safetyStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="最近投喂样本">
        {recentSamples.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-card/30 px-4 py-6 text-sm text-muted-foreground">
            暂无样本。请前往
            <Link to="/system/intake-forge" className="mx-1 underline">投喂式训练数据铸造炉</Link>
            投喂第一批原料。
          </div>
        ) : (
          <ul className="space-y-2">
            {recentSamples.map((s) => (
              <li key={s.id} className="rounded-md border border-border bg-card/40 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{s.sampleType}</span>
                  <span className={`text-xs ${STATUS_COLORS[s.safetyStatus]}`}>{s.safetyStatus} · 质量 {(s.qualityScore ?? 0).toFixed(2)}</span>
                </div>
                <div className="mt-1 line-clamp-2 text-foreground/90">{s.instruction}</div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="可导出格式">
        <div className="flex flex-wrap gap-2">
          {exportFormats.map((f) => (
            <span key={f} className="rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-foreground/80">
              {f}
            </span>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          所有真实导出请在
          <Link to="/system/datasets" className="mx-1 underline">数据集</Link>
          页面对单个数据集版本触发，本页不直接导出。
        </div>
      </Section>

      <Section title="本机训练任务草案">
        {plans.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-card/30 px-4 py-6 text-sm text-muted-foreground">
            暂无训练计划。请前往
            <Link to="/system/local-training" className="mx-1 underline">本机训练</Link>
            为数据集创建第一份计划。
          </div>
        ) : (
          <ul className="space-y-2">
            {plans.slice(0, 6).map((b: LocalTrainingBundle) => (
              <li key={b.plan.id} className="rounded-md border border-border bg-card/40 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>{b.plan.name ?? b.plan.id}</span>
                  <span className="text-xs text-muted-foreground">{b.plan.trainingMode} · {b.plan.targetModel}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="风险与安全">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="BLOCK 样本"  value={stats.block} tone={stats.block ? "text-rose-300" : undefined} />
          <Stat label="WARN 样本"   value={stats.warn}  tone={stats.warn  ? "text-amber-300" : undefined} />
          <Stat label="数据集 BLOCK" value={datasets.filter((d) => d.safetyStatus === "BLOCK").length} />
        </div>
        <div className="rounded-md border border-border bg-card/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          数据引擎遵循 AetherSeed 安全策略：Full60 / Founder-only / secret 类原料在 Intake Forge 阶段即被识别并打上 BLOCK / WARN 标签，
          BLOCK 样本不会进入数据集导出，也不会进入本机训练计划。本页统计为只读结果，详细处置请见
          <Link to="/system/intake-forge" className="mx-1 underline">投喂炉</Link>
          与
          <Link to="/system/datasets" className="mx-1 underline">数据集</Link>
          的安全报告。
        </div>
      </Section>

      <Section title="下一步建议">
        <ul className="space-y-2 text-sm">
          {nextSteps.map((step, i) => (
            <li key={i} className="rounded-md border border-border bg-card/40 px-3 py-2">
              {step.to ? (
                <Link to={step.to} className="text-foreground hover:underline">{step.text}</Link>
              ) : (
                <span className="text-muted-foreground">{step.text}</span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <footer className="text-xs text-muted-foreground">
        <Link to="/system" className="underline">返回系统总览</Link>
        <span className="mx-2">·</span>
        <Link to="/system/page-completeness" className="underline">页面完整性</Link>
      </footer>
    </div>
  );
}

export const Route = createFileRoute("/system/data-engine")({
  head: () => ({ meta: [{ title: "数据引擎 · Aetherworld" }] }),
  component: DataEnginePage,
});
