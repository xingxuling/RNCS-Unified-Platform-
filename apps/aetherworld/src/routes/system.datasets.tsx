// AetherSeed Dataset · 工作台 · /system/datasets
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
  DATASET_TYPE_LABEL,
  type DatasetExportFormat,
  type DatasetType,
} from "@/lib/aetherseed-dataset/datasetTypes";
import {
  buildDatasetVersion,
  groupTrainingSamplesByType,
  listDatasetVersions,
} from "@/lib/aetherseed-dataset/datasetBuilder";
import {
  ingestIntakeRunIntoStores,
} from "@/lib/aetherseed-dataset/datasetIntakeBridge";
import {
  exportDatasetVersion,
} from "@/lib/aetherseed-dataset/datasetExporter";
import { manifestToJson } from "@/lib/aetherseed-dataset/datasetManifestBuilder";
import {
  DATASET_SAFETY_ALLOWED,
  DATASET_SAFETY_FORBIDDEN,
} from "@/lib/aetherseed-dataset/datasetSafetyPolicy";
import {
  countTrainingSamples,
  listTrainingSamples,
} from "@/lib/aetherseed-dataset/trainingSampleStore";
import { countEvalSamples } from "@/lib/aetherseed-dataset/evalSampleStore";
import {
  computeDatasetTokenStats,
  evaluateAllModelFitness,
  formatTokens,
  SPLIT_PRESET_LABEL,
  type SplitPreset,
} from "@/lib/aetherseed-dataset/datasetTokenEstimator";
import { sealSmokeDataset } from "@/lib/aetherseed-dataset/datasetSmokeVersionSealer";
import { trimEvalSamplesToCount } from "@/lib/aetherseed-dataset/evalSampleStore";
import {
  SLICE_STRATEGY_SPECS,
  AETHERSEED_300M_DEFAULT_SLICE_STRATEGY,
} from "@/lib/aetherseed-dataset/datasetSliceStrategy";
import {
  runIntakeFromPaste,
} from "@/lib/intake-forge/intakeForgeRuntime";
import { buildDatasetWorkspaceArtifact } from "@/lib/aetherseed-dataset/datasetWorkspaceBridge";
import {
  countRawCorpusDocuments,
  sumRawCorpusTokens,
} from "@/lib/aetherseed-dataset/rawCorpusStore";
import {
  countLongCorpusChunks,
  sumLongCorpusTokens,
} from "@/lib/aetherseed-dataset/longCorpusStore";
import { listFullCorpusCandidates } from "@/lib/aetherseed-dataset/fullCorpusCandidateStore";
import {
  buildEvalDownloadFile,
  buildEvalManifestDownloadFile,
  buildManifestDownloadFile,
  buildTrainingDownloadFile,
} from "@/lib/aetherseed-dataset/datasetDownloadBuilder";
import {
  buildBlockedSummaryFile,
  buildSafetyReport,
  buildSafetyReportFile,
} from "@/lib/aetherseed-dataset/datasetExportSafetyReport";
import { buildDatasetPackage } from "@/lib/aetherseed-dataset/datasetExportPackageBuilder";
import {
  downloadFilesSequentially,
  downloadTextFile,
  isBrowserDownloadSupported,
} from "@/lib/aetherseed-dataset/datasetBrowserDownload";

export const Route = createFileRoute("/system/datasets")({
  head: () => ({
    meta: [
      { title: "数据集 · AetherSeed Dataset Builder" },
      {
        name: "description",
        content:
          "把投喂铸造炉候选样本收编为正式可管理、可导出、可版本化的训练数据集。不真正训练、不自动上传。",
      },
    ],
  }),
  component: DatasetsPage,
});

const STATUS_COLOR: Record<string, string> = {
  PASS: "text-emerald-500 border-emerald-500/40",
  WARN: "text-amber-500 border-amber-500/40",
  BLOCK: "text-rose-500 border-rose-500/40",
};

const DATASET_TYPES: DatasetType[] = [
  "PRETRAIN",
  "SFT",
  "ROUTER",
  "MSL",
  "TOOL_CALLING",
  "LOVABLE_PROMPT",
  "AGENT_PANEL",
  "PREDICTION",
  "WORLD",
  "SAFETY",
  "EVAL",
  "MIXED",
];

const EXPORT_FORMATS: DatasetExportFormat[] = ["TXT", "JSONL", "CHATML", "ALPACA"];

function DatasetsPage() {
  const [name, setName] = useState("AetherSeed Core Mix");
  const [datasetType, setDatasetType] = useState<DatasetType>("SFT");
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0); // 触发列表重渲染
  const [exportFormat, setExportFormat] = useState<DatasetExportFormat>("JSONL");
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const versions = useMemo(() => {
    void tick;
    return listDatasetVersions();
  }, [tick]);

  const composition = useMemo(() => {
    void tick;
    return groupTrainingSamplesByType();
  }, [tick]);

  const selected = useMemo(
    () => versions.find((v) => v.id === selectedVersionId) ?? null,
    [versions, selectedVersionId],
  );

  const handleIngestPaste = useCallback(async () => {
    if (!paste.trim()) return;
    setBusy(true);
    try {
      const run = await runIntakeFromPaste(paste);
      ingestIntakeRunIntoStores(run);
      setPaste("");
      setTick((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }, [paste]);

  const handleBuildLatestRun = useCallback(() => {
    // 从最近一次投喂派生：v0.1 以「全部内存样本」近似
    const samples = listTrainingSamples().filter((s) => s.safetyStatus !== "BLOCK");
    if (samples.length === 0) return;
    buildDatasetVersion({
      name,
      datasetType,
      sampleIds: samples.map((s) => s.id),
      description: `由 /system/datasets 一键构建 · ${samples.length} 条样本`,
    });
    setTick((n) => n + 1);
  }, [name, datasetType]);

  const handleExport = useCallback(() => {
    if (!selected) return null;
    return exportDatasetVersion(selected, exportFormat);
  }, [selected, exportFormat]);

  const exportArtifact = selected ? exportDatasetVersion(selected, exportFormat) : null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          AetherSeed Dataset Builder v0.1
        </div>
        <h1 className="text-2xl font-semibold">数据集</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          把投喂铸造炉的候选样本收编为正式可管理、可导出、可版本化的训练数据集。
          BLOCK 样本永不导出；不真正训练；不自动上传外部。
        </p>
      </header>

      {/* 当前内存计数 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
        {[
          { k: "训练样本", v: countTrainingSamples() },
          { k: "评测样本", v: countEvalSamples() },
          { k: "数据集版本", v: versions.length },
          { k: "样本类型种类", v: composition.length },
        ].map((c) => (
          <div key={c.k} className="rounded-md border border-border/40 bg-muted/10 p-2 text-center">
            <div className="text-muted-foreground">{c.k}</div>
            <div className="text-base text-foreground/90">{c.v}</div>
          </div>
        ))}
      </section>

      {/* Token 统计与模型适配度 */}
      <TokenStatsPanel tick={tick} />



      {/* 快速投喂（直接送入 Store） */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
        <div className="text-xs text-muted-foreground">① 快速投喂（直接进入数据集存储）</div>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="粘贴 ChatGPT 压缩对话 / Lovable Prompt / MSL 帧 / 文档原文；自动跑完识别、脱敏、切片、样本与评测，并写入数据集存储。"
          className="w-full h-32 text-xs bg-background/60 border border-border/50 rounded-md p-2 font-mono leading-relaxed resize-y"
        />
        <button
          disabled={busy || !paste.trim()}
          onClick={handleIngestPaste}
          className="text-xs px-3 py-1.5 rounded-md border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40"
        >
          {busy ? "处理中…" : "投喂并写入数据集存储"}
        </button>
        <div className="text-[10px] text-muted-foreground">
          完整投喂入口（含文件 / 文件夹）请前往 <a className="underline" href="/system/intake-forge">/system/intake-forge</a>。
        </div>
      </section>

      {/* 构建数据集版本 */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
        <div className="text-xs text-muted-foreground">② 构建数据集版本</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="数据集名称"
            className="text-xs bg-background/60 border border-border/50 rounded-md p-2"
          />
          <select
            value={datasetType}
            onChange={(e) => setDatasetType(e.target.value as DatasetType)}
            className="text-xs bg-background/60 border border-border/50 rounded-md p-2"
          >
            {DATASET_TYPES.map((t) => (
              <option key={t} value={t}>
                {DATASET_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <button
            onClick={handleBuildLatestRun}
            disabled={countTrainingSamples() === 0}
            className="text-xs px-3 py-1.5 rounded-md border border-sky-500/40 text-sky-400 hover:bg-sky-500/10 disabled:opacity-40"
          >
            从当前样本构建版本
          </button>
        </div>
        {composition.length > 0 && (
          <div className="text-[10px] text-muted-foreground">
            当前样本类型组成：
            {composition.map((c) => `${c.sampleType}×${c.count}`).join(" · ")}
          </div>
        )}
      </section>

      {/* Full Corpus 分区：材料工厂自动入库 */}
      <FullCorpusPanel tick={tick} />



      {/* 版本列表 */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
        <div className="text-xs text-muted-foreground">数据集版本（{versions.length}）</div>
        {versions.length === 0 ? (
          <div className="text-[11px] text-muted-foreground border border-dashed border-border/50 rounded-md p-4 text-center">
            还未构建任何数据集版本。先投喂样本，再点上方构建按钮。
          </div>
        ) : (
          <div className="space-y-1.5">
            {versions.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVersionId(v.id)}
                className={`w-full text-left rounded-md border p-2 text-[11px] space-y-1 transition ${
                  selectedVersionId === v.id
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : "border-border/40 bg-muted/10 hover:border-border/70"
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-foreground/90">{v.name}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{v.version}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{DATASET_TYPE_LABEL[v.datasetType]}</span>
                  <span
                    className={`ml-auto px-1.5 py-0.5 rounded-full border text-[10px] ${
                      STATUS_COLOR[v.safetyStatus]
                    }`}
                  >
                    {v.safetyStatus}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  样本 {v.sampleCount} · 评测 {v.evalSampleIds.length} · 质量 {v.qualityScore} ·
                  默认 {v.defaultExportFormats.join(" / ")}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 导出预览 */}
      {selected && (
        <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs text-muted-foreground">③ 导出预览 · {selected.name} · {selected.version}</div>
            <div className="flex items-center gap-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as DatasetExportFormat)}
                className="text-xs bg-background/60 border border-border/50 rounded-md p-1"
              >
                {EXPORT_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <button
                onClick={handleExport}
                className="text-xs px-2 py-1 rounded-md border border-violet-500/40 text-violet-400 hover:bg-violet-500/10"
              >
                重算预览
              </button>
            </div>
          </div>

          {exportArtifact && (
            <>
              <div className="text-[11px] text-muted-foreground">
                文件名建议：{exportArtifact.fileName} · 总行数 {exportArtifact.totalLines} · 已排除 BLOCK / 敏感 {exportArtifact.blockedExcluded} 条
              </div>
              {exportArtifact.warnings.length > 0 && (
                <ul className="text-[11px] text-amber-400/90 list-disc list-inside space-y-0.5">
                  {exportArtifact.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
              <pre className="text-[10px] text-foreground/80 bg-background/60 border border-border/40 rounded-md p-2 overflow-auto max-h-64 whitespace-pre-wrap">
                {exportArtifact.contentPreview || "[无可导出样本]"}
              </pre>
            </>
          )}

          <details className="text-[11px]">
            <summary className="cursor-pointer text-muted-foreground">dataset_manifest.json</summary>
            <pre className="mt-1 text-[10px] text-foreground/80 bg-background/60 border border-border/40 rounded-md p-2 overflow-auto max-h-64">
              {manifestToJson(selected)}
            </pre>
          </details>

          <details className="text-[11px]">
            <summary className="cursor-pointer text-muted-foreground">Workspace 草案（预留）</summary>
            <pre className="mt-1 text-[10px] text-foreground/80 bg-background/60 border border-border/40 rounded-md p-2 overflow-auto max-h-64">
              {JSON.stringify(
                buildDatasetWorkspaceArtifact(
                  selected,
                  exportArtifact ? [exportArtifact] : [],
                ),
                null,
                2,
              )}
            </pre>
          </details>
        </section>
      )}

      {/* ④ 真实文件下载 */}
      {selected && (
        <DatasetDownloadSection version={selected} format={exportFormat} />
      )}

      {/* 安全策略 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="text-emerald-400 mb-1">允许</div>
          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
            {DATASET_SAFETY_ALLOWED.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-3">
          <div className="text-rose-400 mb-1">禁止</div>
          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
            {DATASET_SAFETY_FORBIDDEN.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

interface DatasetDownloadSectionProps {
  version: ReturnType<typeof listDatasetVersions>[number];
  format: DatasetExportFormat;
}

function DatasetDownloadSection({ version, format }: DatasetDownloadSectionProps) {
  const [status, setStatus] = useState<string>("");
  const supported = isBrowserDownloadSupported();
  const safety = useMemo(() => buildSafetyReport(version), [version]);
  const train = useMemo(() => buildTrainingDownloadFile(version, format), [version, format]);
  const evalRes = useMemo(() => buildEvalDownloadFile(version), [version]);

  const handle = (label: string, fn: () => boolean | Promise<unknown>) => async () => {
    try {
      const r = await fn();
      setStatus(typeof r === "boolean" && !r ? `${label}：浏览器不支持下载` : `${label}：已触发下载`);
    } catch (e) {
      setStatus(`${label} 失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const dlTrain = handle("训练集", () => downloadTextFile(train.file));
  const dlEval = handle("评测集", () => downloadTextFile(evalRes.file));
  const dlManifest = handle("Manifest", () => downloadTextFile(buildManifestDownloadFile(version)));
  const dlEvalManifest = handle("Eval Manifest", () =>
    downloadTextFile(buildEvalManifestDownloadFile(version)),
  );
  const dlSafety = handle("安全报告", () => downloadTextFile(buildSafetyReportFile(version)));
  const dlBlocked = handle("阻断摘要", () => downloadTextFile(buildBlockedSummaryFile(version)));
  const dlPackage = handle("完整训练包", async () => {
    const pkg = buildDatasetPackage(version, format === "TXT" ? "JSONL" : format);
    const r = await downloadFilesSequentially(pkg.files, 350);
    return r.ok;
  });

  return (
    <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs text-muted-foreground">
          ④ 真实文件下载 · {version.name} · {version.version}
        </div>
        <div className="text-[10px] text-muted-foreground">
          仅浏览器本地生成，不上传外部
        </div>
      </div>

      {!supported && (
        <div className="text-[11px] text-amber-400">当前环境不支持浏览器下载（缺少 Blob / document）。</div>
      )}

      {/* 安全检查结果 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
        <div className="rounded-md border border-border/40 bg-muted/10 p-2">
          <div className="text-muted-foreground">训练 · 可导出</div>
          <div className="text-emerald-400">{safety.counters.trainingExported}</div>
        </div>
        <div className="rounded-md border border-border/40 bg-muted/10 p-2">
          <div className="text-muted-foreground">训练 · 已阻断</div>
          <div className="text-rose-400">{safety.counters.trainingBlocked}</div>
        </div>
        <div className="rounded-md border border-border/40 bg-muted/10 p-2">
          <div className="text-muted-foreground">评测 · 可导出</div>
          <div className="text-emerald-400">{safety.counters.evalExported}</div>
        </div>
        <div className="rounded-md border border-border/40 bg-muted/10 p-2">
          <div className="text-muted-foreground">评测 · 已阻断</div>
          <div className="text-rose-400">{safety.counters.evalBlocked}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={dlTrain}
          disabled={!supported || train.exportedSamples === 0}
          className="text-xs px-3 py-1.5 rounded-md border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40"
        >
          下载训练集（{format} · {train.exportedSamples} 条）
        </button>
        <button
          onClick={dlEval}
          disabled={!supported || evalRes.exportedEvals === 0}
          className="text-xs px-3 py-1.5 rounded-md border border-sky-500/40 text-sky-400 hover:bg-sky-500/10 disabled:opacity-40"
        >
          下载评测集（JSONL · {evalRes.exportedEvals} 条）
        </button>
        <button
          onClick={dlManifest}
          disabled={!supported}
          className="text-xs px-3 py-1.5 rounded-md border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 disabled:opacity-40"
        >
          下载 dataset_manifest.json
        </button>
        <button
          onClick={dlEvalManifest}
          disabled={!supported}
          className="text-xs px-3 py-1.5 rounded-md border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 disabled:opacity-40"
        >
          下载 eval_manifest.json
        </button>
        <button
          onClick={dlSafety}
          disabled={!supported}
          className="text-xs px-3 py-1.5 rounded-md border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 disabled:opacity-40"
        >
          下载安全报告
        </button>
        <button
          onClick={dlBlocked}
          disabled={!supported}
          className="text-xs px-3 py-1.5 rounded-md border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 disabled:opacity-40"
        >
          下载阻断摘要
        </button>
        <button
          onClick={dlPackage}
          disabled={!supported}
          className="text-xs px-3 py-1.5 rounded-md border border-foreground/40 text-foreground hover:bg-foreground/5 disabled:opacity-40"
        >
          下载完整训练包（多文件）
        </button>
      </div>

      {status && (
        <div className="text-[11px] text-muted-foreground">{status}</div>
      )}

      <div className="text-[10px] text-muted-foreground leading-relaxed">
        说明：完整训练包通过浏览器顺序下载 6 个文件
        （train / eval / manifest / readme / safety_report / blocked_summary），
        首次点击若被浏览器拦截，请在地址栏右侧允许「多文件下载」后重试。
      </div>
    </section>
  );
}

interface TokenStatsPanelProps {
  tick: number;
}

function TokenStatsPanel({ tick }: TokenStatsPanelProps) {
  const [splitPreset, setSplitPreset] = useState<SplitPreset>("BALANCED_90_10");
  const [sealMsg, setSealMsg] = useState<string>("");
  const [rebalanceMsg, setRebalanceMsg] = useState<string>("");
  const [innerTick, setInnerTick] = useState(0);

  const stats = useMemo(() => {
    void tick;
    void innerTick;
    return computeDatasetTokenStats(splitPreset);
  }, [tick, innerTick, splitPreset]);
  const fitness = useMemo(() => evaluateAllModelFitness(stats), [stats]);

  const onSealSmoke = () => {
    const r = sealSmokeDataset();
    setSealMsg(
      r.ok
        ? `✅ 已封版：${r.version?.name} ${r.version?.version}。仅供：${r.allowedUses.join(" / ")}。`
        : `❌ ${r.reason ?? "封版失败"}`,
    );
    setInnerTick((n) => n + 1);
  };

  const onRebalance = () => {
    const total = stats.trainingTotalTokens + stats.evalTotalTokens;
    if (total === 0) {
      setRebalanceMsg("没有样本，无需再平衡。");
      return;
    }
    const targetEvalTokens = Math.round(total * stats.splitAnalysis.targetEvalRatio);
    const avgEval = stats.evalSampleCount === 0 ? 0 : stats.evalTotalTokens / stats.evalSampleCount;
    const targetEvalCount = avgEval === 0 ? stats.evalSampleCount : Math.max(0, Math.round(targetEvalTokens / avgEval));
    if (targetEvalCount >= stats.evalSampleCount) {
      setRebalanceMsg("当前评测集已不高于目标比例，无需裁剪。");
      return;
    }
    const removed = trimEvalSamplesToCount(targetEvalCount);
    setRebalanceMsg(`已裁剪评测集，移除 ${removed} 条（保留 ${targetEvalCount} 条）。`);
    setInnerTick((n) => n + 1);
  };

  return (
    <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs text-muted-foreground">⓪ Token 统计 / 训练评测划分 / 质量面板 / 冒烟封版</div>
        <div className="text-[10px] text-muted-foreground">本地启发式估算 · 不上传 · ±20% 偏差</div>
      </div>

      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] text-amber-300">
        样本条数不等于 token 数。当前数据足够验证训练链路，不代表足够训练出高质量模型。
      </div>

      {/* Token 总览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
        {[
          { k: "训练总 token", v: formatTokens(stats.trainingTotalTokens) },
          { k: "评测总 token", v: formatTokens(stats.evalTotalTokens) },
          { k: "有效 token", v: formatTokens(stats.effectiveTrainingTokens) },
          { k: "重复率", v: `${(stats.duplicationRate * 100).toFixed(1)}%` },
          { k: "平均每条 token", v: String(stats.avgTrainingTokens) },
          { k: "最长样本 token", v: String(stats.maxTrainingTokens) },
          { k: "最短样本 token", v: String(stats.minTrainingTokens) },
          { k: "训练样本数", v: String(stats.trainingSampleCount) },
        ].map((c) => (
          <div key={c.k} className="rounded-md border border-border/40 bg-muted/10 p-2 text-center">
            <div className="text-muted-foreground">{c.k}</div>
            <div className="text-base text-foreground/90">{c.v}</div>
          </div>
        ))}
      </div>

      {/* 训练 / 评测划分 */}
      <div className="rounded-md border border-border/40 bg-muted/10 p-3 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-[11px] text-foreground/90">训练 / 评测划分策略</div>
          <select
            className="text-[11px] bg-background border border-border/40 rounded px-2 py-1"
            value={splitPreset}
            onChange={(e) => setSplitPreset(e.target.value as SplitPreset)}
          >
            {(Object.keys(SPLIT_PRESET_LABEL) as SplitPreset[]).map((p) => (
              <option key={p} value={p}>{SPLIT_PRESET_LABEL[p]}</option>
            ))}
          </select>
        </div>
        <div className="text-[11px] text-muted-foreground">
          当前：训练 {formatTokens(stats.splitAnalysis.currentTrainTokens)} ／ 评测 {formatTokens(stats.splitAnalysis.currentEvalTokens)}
          ｜ 评测占 {(stats.splitAnalysis.currentEvalRatio * 100).toFixed(1)}% ｜
          目标占比 {(stats.splitAnalysis.targetEvalRatio * 100).toFixed(0)}%
        </div>
        <div className={`text-[11px] ${stats.splitAnalysis.unhealthy ? "text-rose-300" : "text-emerald-300"}`}>
          {stats.splitAnalysis.hint}
        </div>
        <div className="text-[10px] text-muted-foreground">
          评测集不应大于训练集。第一炉建议评测占 5%–15%。
        </div>
        {stats.splitAnalysis.evalSamplesToTrim > 0 && (
          <button
            type="button"
            onClick={onRebalance}
            className="text-[11px] rounded-md border border-border/60 bg-background/40 px-3 py-1 hover:bg-muted/30"
          >
            裁剪评测集到目标比例（移除最旧的 {stats.splitAnalysis.evalSamplesToTrim} 条）
          </button>
        )}
        {rebalanceMsg && <div className="text-[11px] text-foreground/80">{rebalanceMsg}</div>}
      </div>

      {/* 按格式桶统计 */}
      <div className="space-y-1">
        <div className="text-[11px] text-muted-foreground">按样本类型 Token 分布</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
          {stats.byFormat.map((row) => (
            <div key={row.bucket} className="rounded-md border border-border/40 bg-muted/10 p-2">
              <div className="text-foreground/90">{row.bucketLabel}</div>
              <div className="text-muted-foreground">
                样本 {row.sampleCount} · token {formatTokens(row.totalTokens)} · 平均 {row.avgTokens}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 样本长度分层 */}
      <div className="space-y-1">
        <div className="text-[11px] text-muted-foreground">按样本长度分层（短 / 中 / 长 / 超长）</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          {stats.byLengthTier.map((row) => (
            <div key={row.tier} className="rounded-md border border-border/40 bg-muted/10 p-2">
              <div className="text-foreground/90">{row.tierLabel}</div>
              <div className="text-muted-foreground">
                {row.sampleCount} 条 · {formatTokens(row.totalTokens)} · {(row.tokenShare * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-muted-foreground/80">{row.usage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 切片策略推荐 */}
      <div className="rounded-md border border-border/40 bg-muted/10 p-3 space-y-1">
        <div className="text-[11px] text-foreground/90">
          AetherSeed 300M 推荐切片模式：
          <span className="ml-2 text-emerald-300">
            {SLICE_STRATEGY_SPECS[AETHERSEED_300M_DEFAULT_SLICE_STRATEGY].label}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-[10px] text-muted-foreground">
          {Object.values(SLICE_STRATEGY_SPECS).map((s) => (
            <div key={s.strategy} className="rounded border border-border/30 p-1.5">
              <div className="text-foreground/80">{s.label}</div>
              <div>{s.minTokens}–{s.maxTokens} token</div>
              <div>{s.usage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 质量面板 */}
      <div className="rounded-md border border-border/40 bg-muted/10 p-3 space-y-2">
        <div className="text-[11px] text-foreground/90">数据集质量面板</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          {[
            { k: "有效 token", v: formatTokens(stats.qualityPanel.effectiveTokens) },
            { k: "训练/评测", v: stats.qualityPanel.trainEvalRatioText },
            { k: "平均每条", v: `${stats.qualityPanel.avgSampleTokens} token` },
            { k: "中长样本占比", v: `${(stats.qualityPanel.midLongShare * 100).toFixed(1)}%` },
            { k: "SFT token", v: formatTokens(stats.qualityPanel.sftTokens) },
            { k: "Alpaca token", v: formatTokens(stats.qualityPanel.alpacaTokens) },
            { k: "Pretrain token", v: formatTokens(stats.qualityPanel.pretrainTokens) },
            { k: "ChatML token", v: formatTokens(stats.qualityPanel.chatmlTokens) },
          ].map((c) => (
            <div key={c.k} className="rounded border border-border/30 p-2 text-center">
              <div className="text-muted-foreground">{c.k}</div>
              <div className="text-foreground/90">{c.v}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className={stats.qualityPanel.okForSmoke ? "text-emerald-300" : "text-rose-300"}>
            适合冒烟训练：{stats.qualityPanel.okForSmoke ? "✅" : "❌"}
          </span>
          <span className={stats.qualityPanel.okForFirstRelease ? "text-emerald-300" : "text-rose-300"}>
            适合正式训练：{stats.qualityPanel.okForFirstRelease ? "✅" : "❌"}
          </span>
        </div>
        {stats.qualityPanel.comments.length > 0 && (
          <ul className="text-[10px] text-muted-foreground list-disc list-inside space-y-0.5">
            {stats.qualityPanel.comments.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        )}
      </div>

      {/* 模型适配度 */}
      <div className="space-y-2">
        <div className="text-[11px] text-muted-foreground">模型适配度（基于有效 token）</div>
        {fitness.map((rep) => (
          <div key={rep.model} className="rounded-md border border-border/40 bg-muted/10 p-2 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-foreground/90">{rep.modelLabel}</span>
              <span className="text-muted-foreground">当前档位：{rep.reachedLevelLabel}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
              {rep.rows.map((r) => (
                <div
                  key={r.level}
                  className={`rounded-md border p-2 ${
                    r.ok
                      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
                      : "border-rose-500/30 bg-rose-500/5 text-rose-300"
                  }`}
                >
                  <div className="text-foreground/90">{r.levelLabel}</div>
                  <div className="text-muted-foreground">
                    门槛 {formatTokens(r.thresholdTokens)}
                  </div>
                  <div>
                    {r.ok ? "✅ 已满足" : `❌ 还差 ${formatTokens(r.shortfallTokens)}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 冒烟封版 */}
      <div className="rounded-md border border-border/40 bg-muted/10 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-[11px] text-foreground/90">
            冒烟数据集封版建议：<span className="text-emerald-300">{stats.smokeReadiness.suggestedName}</span>
          </div>
          <button
            type="button"
            onClick={onSealSmoke}
            disabled={!stats.smokeReadiness.ready}
            className="text-[11px] rounded-md border border-border/60 bg-background/40 px-3 py-1 hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            封版为冒烟数据集
          </button>
        </div>
        <ul className="text-[10px] text-muted-foreground list-disc list-inside space-y-0.5">
          {stats.smokeReadiness.reasons.map((c, i) => <li key={i}>{c}</li>)}
          {stats.smokeReadiness.forbiddenLabels.map((c, i) => <li key={`f${i}`} className="text-rose-300/80">{c}</li>)}
        </ul>
        {sealMsg && <div className="text-[11px] text-foreground/80">{sealMsg}</div>}
      </div>

      <ul className="text-[10px] text-muted-foreground list-disc list-inside space-y-0.5">
        {stats.caveats.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </section>
  );
}

function FullCorpusPanel({ tick }: { tick: number }) {
  const data = useMemo(() => {
    void tick;
    return {
      rawCount: countRawCorpusDocuments(),
      rawTokens: sumRawCorpusTokens(),
      longCount: countLongCorpusChunks(),
      longTokens: sumLongCorpusTokens(),
      candidates: listFullCorpusCandidates(),
    };
  }, [tick]);

  return (
    <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-emerald-300">材料工厂自动入库 · 全量语料分区（Full Corpus）</div>
        <div className="text-[10px] text-muted-foreground">
          材料工厂自动将 RawCorpus / LongCorpus / FullCorpusCandidate 写入，并自动封版为 FULL_CORPUS 数据集版本
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
        <div className="rounded-md border border-border/40 bg-background/30 p-2">
          <div className="text-muted-foreground">原始文档（RawCorpus）</div>
          <div className="text-foreground/90">{data.rawCount} 篇 · {formatTokens(data.rawTokens)}</div>
        </div>
        <div className="rounded-md border border-border/40 bg-background/30 p-2">
          <div className="text-muted-foreground">长语料切片（LongCorpus）</div>
          <div className="text-foreground/90">{data.longCount} 段 · {formatTokens(data.longTokens)}</div>
        </div>
        <div className="rounded-md border border-border/40 bg-background/30 p-2">
          <div className="text-muted-foreground">全量候选数</div>
          <div className="text-foreground/90">{data.candidates.length} 份</div>
        </div>
        <div className="rounded-md border border-border/40 bg-background/30 p-2">
          <div className="text-muted-foreground">候选总 token</div>
          <div className="text-foreground/90">
            {formatTokens(data.candidates.reduce((s, c) => s + c.totalTokens, 0))}
          </div>
        </div>
      </div>

      {data.candidates.length === 0 ? (
        <div className="text-[11px] text-muted-foreground border border-dashed border-border/40 rounded-md p-3 text-center">
          暂无全量语料候选。在 /system/intake-forge 投喂长文档后会自动产生。
        </div>
      ) : (
        <div className="space-y-1.5">
          {data.candidates.slice(0, 6).map((c) => (
            <div
              key={c.id}
              className="rounded-md border border-border/40 bg-background/30 p-2 text-[11px] space-y-0.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-foreground/90">{c.id}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {formatTokens(c.totalTokens)} · 适配：{c.suitableFor.join(" / ") || "—"}
                </span>
                <span
                  className={`ml-auto px-1.5 py-0.5 rounded-full border text-[10px] ${
                    c.readyForExport
                      ? "border-emerald-500/40 text-emerald-300"
                      : "border-amber-500/40 text-amber-300"
                  }`}
                >
                  {c.readyForExport ? "可导出" : "待补足"}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                RAW {c.rawDocumentIds.length} · LONG {c.longChunkIds.length} · SFT {c.trainingSampleIds.length} · EVAL {c.evalSampleIds.length}
                {" · "}license：{c.licenseProfile} · safety：{c.safetyProfile}
              </div>
            </div>
          ))}
          {data.candidates.length > 6 && (
            <div className="text-[10px] text-muted-foreground">仅显示最新 6 份，共 {data.candidates.length} 份。</div>
          )}
        </div>
      )}
    </section>
  );
}
