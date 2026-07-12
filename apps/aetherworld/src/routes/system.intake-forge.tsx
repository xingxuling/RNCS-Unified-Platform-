// 投喂式训练数据铸造炉 · 工作台
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import {
  runIntakeFromPaste,
  runIntakeFromFiles,
  summarizeRun,
} from "@/lib/intake-forge/intakeForgeRuntime";
import type { IntakeForgeRun } from "@/lib/intake-forge/intakeForgeTypes";
import { INTAKE_SOURCE_LABEL } from "@/lib/intake-forge/intakeForgeTypes";
import type { IntakeMode } from "@/lib/intake-forge/intakeAbsorptionTypes";
import {
  INTAKE_MODE_LABEL,
  INTAKE_MODE_DESC,
} from "@/lib/intake-forge/intakeAbsorptionTypes";
import {
  INTAKE_ALLOWED_FILE_EXT,
  INTAKE_FORBIDDEN_FILE_EXT,
  
  INTAKE_MAX_SINGLE_FILE_MB,
  INTAKE_MAX_TOTAL_TEXT_CHARS,
  INTAKE_SAFETY_ALLOWED,
  INTAKE_SAFETY_FORBIDDEN,
} from "@/lib/intake-forge/intakeSafetyPolicy";
import { analyzeIntakeRun } from "@/lib/intake-forge/intakeForgeAnalyticsBridge";
import { buildIntakeWorkspaceArtifact } from "@/lib/intake-forge/intakeForgeWorkspaceBridge";
import { draftIntakeRecord } from "@/lib/intake-forge/intakeForgeRecordBridge";
import { runToMslFrames } from "@/lib/intake-forge/intakeForgeMslBridge";
import { autoSinkIntakeRun } from "@/lib/aetherseed-dataset/intakeAutoDatasetSink";
import type { IntakeDatasetSinkResult } from "@/lib/aetherseed-dataset/intakeAutoDatasetSinkTypes";
import { materialAutoSinkIntakeRun } from "@/lib/aetherseed-dataset/materialAutoSink";
import type { MaterialAutoSinkResult } from "@/lib/aetherseed-dataset/materialAutoSinkTypes";
import { AUTO_SINK_MODE_LABEL } from "@/lib/aetherseed-dataset/materialAutoSinkTypes";
import { buildFullCorpusPackage } from "@/lib/aetherseed-dataset/fullCorpusExporter";
import { downloadFilesSequentially } from "@/lib/aetherseed-dataset/datasetBrowserDownload";
import { Link } from "@tanstack/react-router";
import {
  FOLDER_INTAKE_SCALE_PRESETS,
  FOLDER_SCALE_LABEL,
  FOLDER_SCALE_DESC,
  indexFolder,
  processAllBatches,
  pauseFolderRun,
  cancelFolderRun,
  retryFailedBatches,
  getCurrentFolderRun,
  getFolderFileIndex,
  subscribeFolderRun,
  type FolderIntakeScaleMode,
  type MassiveFolderIntakeRun,
  type FileIndexEntry,
} from "@/lib/intake-forge/folderIntakeScale";
import { useEffect } from "react";
import { getUnifiedLocalGatewayStatus, type LocalGatewayStatus } from "@/lib/local-execution-gateway/localGatewayUnifiedState";

export const Route = createFileRoute("/system/intake-forge")({
  head: () => ({
    meta: [
      { title: "投喂式训练数据铸造炉 · AetherSeed Intake Forge" },
      {
        name: "description",
        content:
          "粘贴 / 文件 / 文件夹一键投喂，自动完成识别、脱敏、切片、样本与评测候选生成，不真正训练、不上传外部。",
      },
    ],
  }),
  component: IntakeForgePage,
});

const STATUS_COLOR: Record<string, string> = {
  PASS: "text-emerald-500 border-emerald-500/40",
  WARN: "text-amber-500 border-amber-500/40",
  BLOCK: "text-rose-500 border-rose-500/40",
};

function IntakeForgePage() {
  const [paste, setPaste] = useState("");
  const [run, setRun] = useState<IntakeForgeRun | null>(null);
  const [sink, setSink] = useState<IntakeDatasetSinkResult | null>(null);
  const [materialSink, setMaterialSink] = useState<MaterialAutoSinkResult | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [intakeMode, setIntakeMode] = useState<IntakeMode>("HYBRID");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const massiveFolderInputRef = useRef<HTMLInputElement>(null);
  const [folderScale, setFolderScale] = useState<FolderIntakeScaleMode>("LARGE_CORPUS");
  const [folderRun, setFolderRun] = useState<MassiveFolderIntakeRun | null>(() => getCurrentFolderRun());
  const [folderIndex, setFolderIndex] = useState<FileIndexEntry[]>(() => getFolderFileIndex());
  const [folderFilter, setFolderFilter] = useState<"ALL" | "ELIGIBLE" | "SKIPPED" | "BLOCKED" | "PROCESSED" | "FAILED">("ALL");
  const [gatewayStatus, setGatewayStatus] = useState<LocalGatewayStatus | null>(null);

  useEffect(() => {
    const unsub = subscribeFolderRun(() => {
      setFolderRun(getCurrentFolderRun());
      setFolderIndex([...getFolderFileIndex()]);
    });
    void getUnifiedLocalGatewayStatus().then(setGatewayStatus);
    return () => { unsub(); };
  }, []);

  const handleMassiveFolderSelected = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    indexFolder({ files, mode: folderScale, absorptionMode: intakeMode });
    // 选择后立即开始处理；用户可随时暂停
    await processAllBatches();
  }, [folderScale, intakeMode]);

  const handlePaste = useCallback(async () => {
    if (!paste.trim()) return;
    setBusy(true);
    try {
      const r = await runIntakeFromPaste(paste, intakeMode);
      setRun(r);
      const ms = materialAutoSinkIntakeRun(r);
      setMaterialSink(ms);
      // 兼容旧 UI
      const oldSink = { ...ms, totalSlices: r.chunks.length, trainingSamplesCreated: ms.shortSamplesCreated, reviewSamplesCreated: 0, blockedSamples: 0, indexOnlySamples: 0, datasetTarget: "AETHERSEED_300M_PRIVATE" as const, autoVersionCandidateId: ms.fullCorpusCandidateId, averageQuality: 0 };
      setSink(oldSink as unknown as IntakeDatasetSinkResult);
    } finally {
      setBusy(false);
    }
  }, [paste, intakeMode]);

  const handleFiles = useCallback(
    async (files: FileList | null, mode: "FILE" | "FOLDER") => {
      if (!files || files.length === 0) return;
      setBusy(true);
      try {
        const r = await runIntakeFromFiles(files, mode, intakeMode);
        setRun(r);
        const ms = materialAutoSinkIntakeRun(r);
        setMaterialSink(ms);
        const oldSink = { ...ms, totalSlices: r.chunks.length, trainingSamplesCreated: ms.shortSamplesCreated, reviewSamplesCreated: 0, blockedSamples: 0, indexOnlySamples: 0, datasetTarget: "AETHERSEED_300M_PRIVATE" as const, autoVersionCandidateId: ms.fullCorpusCandidateId, averageQuality: 0 };
        setSink(oldSink as unknown as IntakeDatasetSinkResult);
      } finally {
        setBusy(false);
      }
    },
    [intakeMode],
  );

  const handleExportFullCorpus = useCallback(async () => {
    if (!materialSink?.fullCorpusCandidateId) return;
    setExporting(true);
    setExportNote(null);
    try {
      const pkg = buildFullCorpusPackage(materialSink.fullCorpusCandidateId);
      if (!pkg) {
        setExportNote("未找到 Full Corpus 候选。");
        return;
      }
      const res = await downloadFilesSequentially(pkg.files);
      setExportNote(`已下载 ${res.success}/${res.total} 个文件（${pkg.baseFolder}）。`);
    } finally {
      setExporting(false);
    }
  }, [materialSink]);

  const analytics = run ? analyzeIntakeRun(run) : null;
  const absorption = run?.absorption;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          AetherSeed Intake Forge v0.1 · Absorption Fix
        </div>
        <h1 className="text-2xl font-semibold">投喂式训练数据铸造炉</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          投喂后同时保留：原始语料（RawCorpusDocument）→ 长语料切片（LongCorpusChunk）→
          中长 SFT 样本 → 短样本 → 评测样本，并显示真实吸收率。
        </p>
      </header>

      {/* 吸收模式选择 */}
      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
        <div className="text-xs text-amber-300/90">吸收模式（决定 raw token 是否被完整保留）</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          {(["SHORT_SAMPLE", "LONG_CORPUS", "HYBRID", "FULL_ABSORB"] as IntakeMode[]).map(
            (m) => {
              const active = intakeMode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setIntakeMode(m)}
                  className={`text-left rounded-md border p-2 transition ${
                    active
                      ? "border-amber-400/70 bg-amber-400/10 text-amber-200"
                      : "border-border/40 bg-muted/10 text-muted-foreground hover:border-border/70"
                  }`}
                >
                  <div className="text-foreground/90 font-medium">{INTAKE_MODE_LABEL[m]}</div>
                  <div className="mt-1 text-[10px] leading-relaxed">{INTAKE_MODE_DESC[m]}</div>
                </button>
              );
            },
          )}
        </div>
        <div className="text-[10px] text-muted-foreground">
          默认混合吸收模式。短样本模式不会生成 LongCorpusChunk，可能导致吸收率偏低。
        </div>
      </section>

      {/* 三种投喂入口 */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* 粘贴 */}
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
          <div className="text-xs text-muted-foreground">① 粘贴投喂</div>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={`把 ChatGPT 压缩对话、Lovable Prompt / 返回、MSL 帧、文档原文粘贴在这里。\n最多 ${INTAKE_MAX_TOTAL_TEXT_CHARS.toLocaleString()} 字符。`}
            className="w-full h-40 text-xs bg-background/60 border border-border/50 rounded-md p-2 font-mono leading-relaxed resize-y"
          />
          <button
            disabled={busy || !paste.trim()}
            onClick={handlePaste}
            className="w-full text-xs px-3 py-1.5 rounded-md border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40"
          >
            {busy ? "处理中…" : "投喂粘贴内容"}
          </button>
        </div>

        {/* 文件 */}
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
          <div className="text-xs text-muted-foreground">② 文件投喂</div>
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            选择 1 个或多个允许后缀的文件，单文件 ≤ {INTAKE_MAX_SINGLE_FILE_MB} MB。
            <br />
            允许：{INTAKE_ALLOWED_FILE_EXT.join(", ")}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={INTAKE_ALLOWED_FILE_EXT.join(",")}
            onChange={(e) => handleFiles(e.target.files, "FILE")}
            className="text-xs"
          />
          <button
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-xs px-3 py-1.5 rounded-md border border-sky-500/40 text-sky-400 hover:bg-sky-500/10 disabled:opacity-40"
          >
            选择文件
          </button>
        </div>

        {/* 文件夹（小批量） */}
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
          <div className="text-xs text-muted-foreground">③ 小批量文件夹投喂</div>
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            适合小文件夹快速测试，仅处理允许后缀。
            <br />
            上限：1,000 个文件 / 累计 10,000,000 字符。大语料请使用下方「大规模文件夹投喂」。
          </div>
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error webkitdirectory 仍可用
            webkitdirectory=""
            directory=""
            multiple
            onChange={(e) => handleFiles(e.target.files, "FOLDER")}
            className="text-xs"
          />
          <button
            disabled={busy}
            onClick={() => folderInputRef.current?.click()}
            className="w-full text-xs px-3 py-1.5 rounded-md border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 disabled:opacity-40"
          >
            选择文件夹（小批量）
          </button>
        </div>
      </section>

      {/* 大规模文件夹投喂 */}
      <MassiveFolderSection
        scale={folderScale}
        setScale={setFolderScale}
        intakeMode={intakeMode}
        run={folderRun}
        index={folderIndex}
        filter={folderFilter}
        setFilter={setFolderFilter}
        gateway={gatewayStatus}
        inputRef={massiveFolderInputRef}
        onSelected={handleMassiveFolderSelected}
      />

      {/* 安全策略 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="text-emerald-400 mb-1">允许</div>
          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
            {INTAKE_SAFETY_ALLOWED.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-3">
          <div className="text-rose-400 mb-1">禁止</div>
          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
            {INTAKE_SAFETY_FORBIDDEN.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <div className="mt-2 text-[10px] text-muted-foreground">
            禁止后缀：{INTAKE_FORBIDDEN_FILE_EXT.join(" ")}
          </div>
        </div>
      </section>

      {/* 运行结果 */}
      {!run && (
        <section className="rounded-md border border-dashed border-border/50 bg-muted/10 p-6 text-center text-xs text-muted-foreground">
          尚未投喂任何内容。粘贴文本、选择文件或文件夹后会自动展示分类、切片、样本与评测候选。
        </section>
      )}

      {run && analytics && (
        <section className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2">
            <div className="text-xs text-muted-foreground">运行摘要</div>
            <div className="text-sm">{summarizeRun(run)}</div>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2 text-[11px]">
              {[
                { k: "条目", v: analytics.itemCount },
                { k: "切片", v: analytics.chunkCount },
                { k: "输出组", v: analytics.outputCount },
                { k: "评测", v: analytics.evalCount },
                { k: "阻断", v: analytics.blockedCount },
                { k: "脱敏", v: analytics.warnedCount },
                { k: "平均质量", v: analytics.averageQuality },
              ].map((c) => (
                <div
                  key={c.k}
                  className="rounded-md border border-border/40 bg-muted/10 p-2 text-center"
                >
                  <div className="text-muted-foreground">{c.k}</div>
                  <div className="text-foreground/90 text-base">{c.v}</div>
                </div>
              ))}
            </div>
            {run.warnings.length > 0 && (
              <ul className="text-[11px] text-amber-400/90 list-disc list-inside space-y-0.5">
                {run.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>

          {/* 吸收报告 */}
          {absorption && (
            <div className="rounded-xl border border-violet-500/40 bg-violet-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs text-violet-300/90">
                  吸收报告 · 当前模式：{INTAKE_MODE_LABEL[absorption.mode]}
                </div>
                <span className="text-[11px] text-violet-200">
                  吸收率 {Math.round(absorption.absorptionRate * 100)}%
                </span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-[11px]">
                {[
                  { k: "原始 token", v: absorption.rawTokens },
                  { k: "已吸收", v: absorption.absorbedTokens },
                  { k: "未吸收", v: absorption.unabsorbedTokens },
                  { k: "长语料", v: absorption.longCorpusTokens },
                  { k: "中样本", v: absorption.mediumSftTokens },
                  { k: "短样本", v: absorption.shortSampleTokens },
                  { k: "SFT token", v: absorption.sftTokens },
                  { k: "Eval token", v: absorption.evalTokens },
                  { k: "Raw 文档", v: absorption.rawDocumentCount },
                  { k: "Long 切片", v: absorption.longChunkCount },
                  { k: "Med 切片", v: absorption.mediumChunkCount },
                  { k: "平均短样本", v: absorption.avgShortSampleTokens },
                ].map((c) => (
                  <div
                    key={c.k}
                    className="rounded-md border border-border/40 bg-muted/10 p-2 text-center"
                  >
                    <div className="text-muted-foreground">{c.k}</div>
                    <div className="text-foreground/90 text-sm">{c.v}</div>
                  </div>
                ))}
              </div>
              {absorption.warnings.length > 0 && (
                <ul className="text-[11px] text-amber-400/90 list-disc list-inside space-y-0.5">
                  {absorption.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
              {absorption.unabsorbedReasons.length > 0 && (
                <ul className="text-[10px] text-muted-foreground list-disc list-inside space-y-0.5">
                  {absorption.unabsorbedReasons.map((r, i) => (
                    <li key={i}>未吸收原因：{r}</li>
                  ))}
                </ul>
              )}
              <div className="text-[11px] text-violet-200">下一步：{absorption.nextAction}</div>
            </div>
          )}



          {/* 材料工厂自动入库 · 五层结构 */}
          {materialSink && (
            <div className="rounded-xl border border-violet-500/40 bg-violet-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-violet-400/80">
                    Material Factory Auto Sink · 五层入库
                  </div>
                  <div className="text-sm text-foreground/90">
                    材料工厂自动入库 · 模式 {AUTO_SINK_MODE_LABEL[materialSink.autoSinkMode]}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full border border-violet-500/40 text-[10px] text-violet-300">
                  状态 · {materialSink.status}
                </span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-[11px]">
                {[
                  { k: "原始文档", v: materialSink.rawDocumentsCreated },
                  { k: "原始 token", v: materialSink.rawTokens },
                  { k: "短样本", v: materialSink.shortSamplesCreated },
                  { k: "中样本", v: materialSink.mediumSamplesCreated },
                  { k: "长切片", v: materialSink.longChunksCreated },
                  { k: "评测", v: materialSink.evalSamplesCreated },
                  { k: "中长 token", v: materialSink.mediumTokens + materialSink.longTokens },
                  { k: "短样本 token", v: materialSink.shortTokens },
                  { k: "已吸收", v: materialSink.absorbedTokens },
                  { k: "吸收率", v: `${(materialSink.absorptionRate * 100).toFixed(1)}%` },
                  { k: "中长占比", v: `${(materialSink.midLongShare * 100).toFixed(1)}%` },
                  { k: "Full Corpus", v: materialSink.fullCorpusCandidateId ? "已生成" : "—" },
                ].map((c) => (
                  <div
                    key={c.k}
                    className="rounded-md border border-border/40 bg-muted/10 p-2 text-center"
                  >
                    <div className="text-muted-foreground">{c.k}</div>
                    <div className="text-foreground/90 text-sm">{c.v}</div>
                  </div>
                ))}
              </div>
              {materialSink.warnings.length > 0 && (
                <ul className="text-[11px] text-amber-400/90 list-disc list-inside space-y-0.5">
                  {materialSink.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  disabled={!materialSink.fullCorpusCandidateId || exporting}
                  onClick={handleExportFullCorpus}
                  className="px-2 py-1 rounded-md border border-violet-500/40 text-violet-300 hover:bg-violet-500/10 disabled:opacity-40"
                >
                  {exporting ? "导出中…" : "真实导出 Full Corpus 包"}
                </button>
                {exportNote && <span className="text-muted-foreground">{exportNote}</span>}
              </div>
              <div className="text-[10px] text-muted-foreground leading-relaxed">
                五层入库：RawCorpusDocument · LongCorpusChunk · 中样本 · 短样本 · 评测样本。
                BLOCK 原文不入库，仅保留指纹；未授权材料不进入正式数据集；不上传、不自动训练。
              </div>
            </div>
          )}

          {/* 自动入库结果 */}
          {sink && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-400/80">
                    Intake Auto Dataset Sink
                  </div>
                  <div className="text-sm text-foreground/90">
                    自动入库结果 · 目标：AetherSeed 300M 私有模型
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full border border-emerald-500/40 text-[10px] text-emerald-300">
                  状态 · {sink.status}
                </span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-[11px]">
                {[
                  { k: "训练样本", v: sink.trainingSamplesCreated },
                  { k: "评测样本", v: sink.evalSamplesCreated },
                  { k: "待复核", v: sink.reviewSamplesCreated },
                  { k: "阻断", v: sink.blockedSamples },
                  { k: "仅索引", v: sink.indexOnlySamples },
                  { k: "平均质量", v: sink.averageQuality },
                ].map((c) => (
                  <div
                    key={c.k}
                    className="rounded-md border border-border/40 bg-muted/10 p-2 text-center"
                  >
                    <div className="text-muted-foreground">{c.k}</div>
                    <div className="text-foreground/90 text-base">{c.v}</div>
                  </div>
                ))}
              </div>
              {sink.autoVersionCandidateId && (
                <div className="text-[11px] text-emerald-300">
                  已生成自动数据集候选：{sink.autoVersionCandidateId}
                  {" · "}
                  {sink.trainingSamplesCreated >= 10 && sink.evalSamplesCreated >= 1
                    ? "可进入真实导出"
                    : "样本量不足，暂不可导出"}
                </div>
              )}
              {sink.notes.length > 0 && (
                <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-0.5">
                  {sink.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <Link
                  to="/system/datasets"
                  className="px-2 py-1 rounded-md border border-border/50 hover:bg-muted/20"
                >
                  打开数据集
                </Link>
                <Link
                  to="/system/data-engine"
                  className="px-2 py-1 rounded-md border border-border/50 hover:bg-muted/20"
                >
                  打开数据引擎
                </Link>
                <Link
                  to="/system/first-run-readiness"
                  className="px-2 py-1 rounded-md border border-border/50 hover:bg-muted/20"
                >
                  打开第一炉训练准备
                </Link>
              </div>
              <div className="text-[10px] text-muted-foreground leading-relaxed">
                安全边界：BLOCK 样本不进入任何训练样本库；来源不明 / 未授权材料仅索引、不训练；
                WARN 样本进入待复核；未脱敏 Founder-only 原文已被阻断。本流程不自动真实训练。
              </div>
            </div>
          )}



          {/* 条目 */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
            <div className="text-xs text-muted-foreground">条目列表（{run.items.length}）</div>
            <div className="space-y-1.5">
              {run.items.map((i) => (
                <div
                  key={i.id}
                  className="rounded-md border border-border/40 bg-muted/10 p-2 text-[11px] space-y-1"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-foreground/90">
                      {i.originalName ?? `粘贴 ${i.id}`}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {INTAKE_SOURCE_LABEL[i.sourceType]}
                    </span>
                    <span
                      className={`ml-auto px-1.5 py-0.5 rounded-full border text-[10px] ${
                        STATUS_COLOR[i.safetyStatus]
                      }`}
                    >
                      {i.safetyStatus}
                    </span>
                  </div>
                  {i.preview && (
                    <div className="text-muted-foreground line-clamp-2 font-mono">
                      {i.preview}
                    </div>
                  )}
                  {i.notes && i.notes.length > 0 && (
                    <div className="text-[10px] text-muted-foreground/80">
                      {i.notes.join(" · ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 输出组 */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
            <div className="text-xs text-muted-foreground">编译输出（{run.outputs.length}）</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              {run.outputs.map((o) => (
                <div key={o.id} className="rounded-md border border-border/40 bg-muted/10 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-foreground/90">{o.format}</span>
                    <span className="text-muted-foreground">{o.sampleCount} 条</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    质量 {o.qualityScore} · {o.safetyStatus}
                  </div>
                  {o.samplePreviews.length > 0 && (
                    <div className="mt-1 text-[10px] text-muted-foreground font-mono line-clamp-3">
                      {o.samplePreviews[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 评测候选 */}
          {run.evals.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
              <div className="text-xs text-muted-foreground">
                评测候选（{run.evals.length}，展示前 8 条）
              </div>
              <div className="space-y-1.5">
                {run.evals.slice(0, 8).map((e) => (
                  <div
                    key={e.id}
                    className="rounded-md border border-border/40 bg-muted/10 p-2 text-[11px] space-y-0.5"
                  >
                    <div className="text-muted-foreground">类型 · {e.evalType}</div>
                    <div className="text-foreground/90 font-mono line-clamp-2">{e.question}</div>
                    <div className="text-[10px] text-emerald-400/80">期望：{e.expected}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 训练任务建议 */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
            <div className="text-xs text-muted-foreground">训练任务草案（不会自动执行）</div>
            <ul className="text-[11px] text-foreground/90 list-disc list-inside space-y-0.5">
              {run.suggestedTrainingTasks.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>

          {/* 桥接草案 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
            <details className="rounded-md border border-border/40 bg-muted/10 p-2">
              <summary className="cursor-pointer text-muted-foreground">
                Workspace 草案（预留）
              </summary>
              <pre className="mt-1 text-[10px] text-foreground/80 overflow-auto max-h-40">
                {JSON.stringify(buildIntakeWorkspaceArtifact(run), null, 2)}
              </pre>
            </details>
            <details className="rounded-md border border-border/40 bg-muted/10 p-2">
              <summary className="cursor-pointer text-muted-foreground">
                Record Center 草案（预留）
              </summary>
              <pre className="mt-1 text-[10px] text-foreground/80 overflow-auto max-h-40">
                {JSON.stringify(draftIntakeRecord(run), null, 2)}
              </pre>
            </details>
            <details className="rounded-md border border-border/40 bg-muted/10 p-2">
              <summary className="cursor-pointer text-muted-foreground">
                MSL 帧草案（预留）
              </summary>
              <pre className="mt-1 text-[10px] text-foreground/80 overflow-auto max-h-40">
                {JSON.stringify(runToMslFrames(run), null, 2)}
              </pre>
            </details>
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================================
// 大规模文件夹投喂卡片
// ============================================================
function MassiveFolderSection(props: {
  scale: FolderIntakeScaleMode;
  setScale: (s: FolderIntakeScaleMode) => void;
  intakeMode: IntakeMode;
  run: MassiveFolderIntakeRun | null;
  index: FileIndexEntry[];
  filter: "ALL" | "ELIGIBLE" | "SKIPPED" | "BLOCKED" | "PROCESSED" | "FAILED";
  setFilter: (f: "ALL" | "ELIGIBLE" | "SKIPPED" | "BLOCKED" | "PROCESSED" | "FAILED") => void;
  gateway: LocalGatewayStatus | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelected: (files: FileList | null) => void;
}) {
  const { scale, setScale, intakeMode, run, index, filter, setFilter, gateway, inputRef, onSelected } = props;
  const limits = FOLDER_INTAKE_SCALE_PRESETS[scale];
  const filtered = index.filter((f) => {
    if (filter === "ALL") return true;
    if (filter === "ELIGIBLE") return f.eligibility === "ELIGIBLE" && f.status !== "PROCESSED" && f.status !== "FAILED";
    if (filter === "SKIPPED") return f.eligibility === "SKIPPED";
    if (filter === "BLOCKED") return f.eligibility === "BLOCKED";
    if (filter === "PROCESSED") return f.status === "PROCESSED";
    if (filter === "FAILED") return f.status === "FAILED";
    return true;
  }).slice(0, 100);

  const gatewayMsg = gateway?.connected
    ? "本地网关已连接，可用于大规模文件夹投喂。"
    : "浏览器模式可处理部分大语料，超大文件夹建议启动 local-gateway。";

  return (
    <section className="rounded-xl border border-violet-500/40 bg-violet-500/5 p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-violet-300">大规模文件夹投喂</div>
          <div className="text-sm text-foreground/90">支持 10 万 / 50 万文件级别目录，分阶段索引 → 过滤 → 批处理。</div>
        </div>
        <div className="text-[11px] text-muted-foreground">{gatewayMsg}</div>
      </div>

      {/* 模式选择 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
        {(["NORMAL", "LARGE_CORPUS", "FOUNDER_LOCAL"] as FolderIntakeScaleMode[]).map((m) => {
          const active = scale === m;
          const l = FOLDER_INTAKE_SCALE_PRESETS[m];
          return (
            <button
              key={m}
              type="button"
              onClick={() => setScale(m)}
              className={`text-left rounded-md border p-2 transition ${
                active ? "border-violet-400/70 bg-violet-400/10 text-violet-100" : "border-border/40 bg-muted/10 text-muted-foreground hover:border-border/70"
              }`}
            >
              <div className="text-foreground/90 font-medium">{FOLDER_SCALE_LABEL[m]}</div>
              <div className="mt-1 text-[10px] leading-relaxed">{FOLDER_SCALE_DESC[m]}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                最多 {l.maxFiles.toLocaleString()} 文件 · batch {l.batchSize}
                {l.requireLocalGatewayRecommended ? " · 建议本地网关" : ""}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-md border border-border/40 bg-background/40 p-3 space-y-2">
        <div className="text-[11px] text-muted-foreground">
          当前模式：<span className="text-foreground">{FOLDER_SCALE_LABEL[scale]}</span> · 最多 {limits.maxFiles.toLocaleString()} 个文件 · 单文件 ≤ {(limits.maxSingleFileBytes / 1024 / 1024).toFixed(0)}MB ·
          目录深度 ≤ {limits.maxDirectoryDepth} · 当前吸收模式：<span className="text-foreground">{intakeMode}</span>
          {intakeMode === "SHORT_SAMPLE" && (
            <span className="ml-1 text-amber-400">（建议改为混合吸收，避免长语料丢失）</span>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          // @ts-expect-error webkitdirectory 仍可用
          webkitdirectory=""
          directory=""
          multiple
          onChange={(e) => onSelected(e.target.files)}
          className="text-xs"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded-md border border-violet-500/50 text-violet-200 hover:bg-violet-500/10"
          >
            选择文件夹并开始索引
          </button>
          {run && run.status === "PROCESSING" && (
            <button type="button" onClick={() => pauseFolderRun()} className="text-xs px-3 py-1.5 rounded-md border border-amber-500/50 text-amber-300 hover:bg-amber-500/10">
              暂停
            </button>
          )}
          {run && run.status === "PAUSED" && (
            <button type="button" onClick={() => processAllBatches()} className="text-xs px-3 py-1.5 rounded-md border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10">
              继续
            </button>
          )}
          {run && (run.status === "PROCESSING" || run.status === "PAUSED") && (
            <button type="button" onClick={() => cancelFolderRun()} className="text-xs px-3 py-1.5 rounded-md border border-rose-500/50 text-rose-300 hover:bg-rose-500/10">
              取消
            </button>
          )}
          {run && run.failedFiles > 0 && (
            <button type="button" onClick={() => retryFailedBatches()} className="text-xs px-3 py-1.5 rounded-md border border-sky-500/50 text-sky-300 hover:bg-sky-500/10">
              重试失败 ({run.failedFiles})
            </button>
          )}
        </div>
      </div>

      {/* 运行状态 */}
      {run && (
        <div className="rounded-md border border-border/40 bg-background/40 p-3 space-y-2 text-[11px]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-foreground">
              任务 {run.id} · {FOLDER_SCALE_LABEL[run.mode]} · {run.folderName}
            </div>
            <div className={
              run.status === "COMPLETED" ? "text-emerald-400" :
              run.status === "PROCESSING" ? "text-sky-300" :
              run.status === "PAUSED" ? "text-amber-300" :
              run.status === "FAILED" ? "text-rose-400" :
              run.status === "PARTIAL" ? "text-amber-400" :
              "text-muted-foreground"
            }>{run.status}</div>
          </div>
          {run.message && <div className="text-muted-foreground">{run.message}</div>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Stat k="总文件" v={run.totalFiles.toLocaleString()} />
            <Stat k="可处理" v={run.eligibleFiles.toLocaleString()} />
            <Stat k="跳过" v={run.skippedFiles.toLocaleString()} />
            <Stat k="阻断" v={run.blockedFiles.toLocaleString()} />
            <Stat k="已处理" v={`${run.processedFiles}/${run.eligibleFiles}`} />
            <Stat k="批次进度" v={`${run.completedBatchCount}/${run.batchCount}`} />
            <Stat k="估算 token" v={run.totalTokenEstimate.toLocaleString()} />
            <Stat k="吸收 token" v={run.absorbedTokenEstimate.toLocaleString()} />
          </div>
          {run.fullCorpusCandidateId && (
            <div className="text-emerald-300">已生成 Full Corpus 候选：{run.fullCorpusCandidateId}</div>
          )}

          {/* 文件列表筛选 */}
          <div className="flex flex-wrap gap-1 pt-2 border-t border-border/30">
            {(["ALL", "ELIGIBLE", "SKIPPED", "BLOCKED", "PROCESSED", "FAILED"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`text-[10px] px-2 py-0.5 rounded border ${
                  filter === f ? "border-violet-400/60 text-violet-200 bg-violet-500/10" : "border-border/40 text-muted-foreground hover:border-border/70"
                }`}>{f}</button>
            ))}
            <span className="ml-auto text-[10px] text-muted-foreground">仅显示前 100 条</span>
          </div>
          <div className="max-h-56 overflow-auto rounded border border-border/30 bg-background/40">
            <table className="w-full text-[10px]">
              <tbody>
                {filtered.map((f, i) => (
                  <tr key={i} className="border-b border-border/20 last:border-b-0">
                    <td className="px-2 py-1 font-mono text-muted-foreground truncate max-w-[280px]" title={f.path}>{f.path}</td>
                    <td className="px-2 py-1">
                      <span className={
                        f.eligibility === "ELIGIBLE" ? "text-emerald-400" :
                        f.eligibility === "BLOCKED" ? "text-rose-400" : "text-amber-400"
                      }>{f.eligibility}</span>
                    </td>
                    <td className="px-2 py-1">
                      <span className={
                        f.status === "PROCESSED" ? "text-emerald-300" :
                        f.status === "FAILED" ? "text-rose-300" :
                        f.status === "SKIPPED" ? "text-muted-foreground" : "text-sky-300"
                      }>{f.status}</span>
                    </td>
                    <td className="px-2 py-1 text-muted-foreground truncate max-w-[200px]" title={f.reason || f.errorMessage || ""}>
                      {f.reason || f.errorMessage || ""}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td className="px-2 py-3 text-center text-muted-foreground">无匹配文件</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* batch 历史 */}
          {run.batchHistory.length > 0 && (
            <details className="pt-2 border-t border-border/30">
              <summary className="cursor-pointer text-muted-foreground">批次明细（{run.batchHistory.length}）</summary>
              <div className="mt-2 space-y-1">
                {run.batchHistory.slice(-10).map((b) => (
                  <div key={b.batchIndex} className="text-[10px] text-muted-foreground">
                    #{b.batchIndex} · {b.fileCount} 文件 · raw {b.rawDocumentsCreated} / long {b.longChunksCreated} / mid {b.mediumSamplesCreated} / short {b.shortSamplesCreated} / eval {b.evalSamplesCreated} · 吸收率 {Math.round(b.absorptionRate * 100)}%
                    {b.error && <span className="text-rose-400"> · 失败 {b.error}</span>}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="rounded border border-border/30 bg-background/60 px-2 py-1">
      <div className="text-[9px] text-muted-foreground">{k}</div>
      <div className="text-sm text-foreground">{v}</div>
    </div>
  );
}
