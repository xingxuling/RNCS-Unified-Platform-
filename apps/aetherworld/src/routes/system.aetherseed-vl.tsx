import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  createVlmSample,
  deleteVlmSample,
  getVlmSampleStats,
  listVlmSamples,
  subscribeVlmSamples,
} from "@/lib/aetherseed-vl/vlmSampleStore";
import { VLM_BASE_MODELS } from "@/lib/aetherseed-vl/vlmBaseModels";
import {
  buildVlmDatasetVersion,
  listVlmDatasetVersions,
  subscribeVlmDatasetVersions,
} from "@/lib/aetherseed-vl/vlmDatasetVersioner";
import {
  buildVlmExportPackage,
  type VlmExportFormat,
} from "@/lib/aetherseed-vl/vlmExportBuilder";
import {
  VLM_PRESETS,
  buildVlmTrainingBundle,
  buildVlmTrainingConfig,
} from "@/lib/aetherseed-vl/vlmTrainingConfigBuilder";
import { getVlmGatewayWhitelist, runVlmDryRun } from "@/lib/aetherseed-vl/vlmDryRun";
import {
  listVlmExperiments,
  recordVlmExperiment,
  subscribeVlmExperiments,
} from "@/lib/aetherseed-vl/vlmExperimentLedger";
import type {
  VlmSampleType,
  VlmTrainingConfig,
  VlmDryRunReport,
} from "@/lib/aetherseed-vl/vlmTypes";

export const Route = createFileRoute("/system/aetherseed-vl")({
  head: () => ({
    meta: [
      { title: "AetherSeed-VL 多模态训练流水线" },
      {
        name: "description",
        content:
          "AetherSeed-VL 私有图文模型训练流水线：图文样本、数据集版本、底座选择、LoRA / SFT / Adapter 配置、dry-run 与本地网关白名单。",
      },
    ],
  }),
  component: AetherSeedVlPage,
});

const SAMPLE_TYPES: { value: VlmSampleType; label: string }[] = [
  { value: "UI_SCREENSHOT_QA", label: "UI 截图问答" },
  { value: "CHARACTER_IMAGE_QA", label: "角色图问答" },
  { value: "SYMBOL_IMAGE_QA", label: "符号图问答" },
  { value: "DIAGRAM_IMAGE_QA", label: "图表问答" },
  { value: "MULTI_IMAGE_QA", label: "多图问答" },
  { value: "IMAGE_CAPTION", label: "图像描述" },
  { value: "IMAGE_INSTRUCTION_PAIR", label: "图像指令对" },
  { value: "IMAGE_TEXT_PAIR", label: "图文对" },
  { value: "IMAGE_REASONING_SAMPLE", label: "图像推理样本" },
];

function useForceUpdate() {
  const [, set] = useState(0);
  return () => set((n) => n + 1);
}

function AetherSeedVlPage() {
  const force = useForceUpdate();
  useEffect(() => {
    const u1 = subscribeVlmSamples(force);
    const u2 = subscribeVlmDatasetVersions(force);
    const u3 = subscribeVlmExperiments(force);
    return () => {
      u1();
      u2();
      u3();
    };
  }, [force]);

  const stats = getVlmSampleStats();
  const samples = listVlmSamples();
  const versions = listVlmDatasetVersions();
  const experiments = listVlmExperiments();

  // —— 投喂表单 ——
  const [sampleType, setSampleType] = useState<VlmSampleType>("UI_SCREENSHOT_QA");
  const [instruction, setInstruction] = useState("这是 Aetherworld 的某个系统页面截图，请描述其功能并给出下一步建议。");
  const [answer, setAnswer] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  function handlePickFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles(arr);
    setImageUrls((old) => {
      old.forEach((u) => URL.revokeObjectURL(u));
      return arr.map((f) => URL.createObjectURL(f));
    });
  }

  function handleCreateSample() {
    if (!files.length || !answer.trim()) return;
    createVlmSample({
      sampleType,
      instruction,
      answer,
      images: files.map((f, i) => ({
        fileName: f.name,
        mimeType: f.type,
        sizeBytes: f.size,
        localObjectUrl: imageUrls[i],
        relativePath: `images/${f.name}`,
      })),
      tags: [sampleType.toLowerCase()],
    });
    setAnswer("");
    setFiles([]);
    imageUrls.forEach((u) => URL.revokeObjectURL(u));
    setImageUrls([]);
  }

  // —— 数据集 / 导出 ——
  const [exportFormat, setExportFormat] = useState<VlmExportFormat>("VLM_CHATML");
  const [exportPreview, setExportPreview] = useState<string>("");

  function handleBuildVersion() {
    buildVlmDatasetVersion();
  }
  function handleExport() {
    const latest = versions[0];
    if (!latest) return;
    const pkg = buildVlmExportPackage(latest.name, exportFormat);
    setExportPreview(
      [
        `# ${pkg.versionName}（${pkg.format}）`,
        `样本数：${pkg.sampleCount}｜图片：${pkg.imageCount}`,
        pkg.warning,
        "",
        "包含文件：",
        ...pkg.files.map((f) => `  · ${f.path}（${f.mimeType}，${f.content.length} bytes）`),
      ].join("\n"),
    );
  }

  // —— 训练配置 ——
  const [presetId, setPresetId] = useState(VLM_PRESETS[0].id);
  const [baseModelId, setBaseModelId] = useState(VLM_BASE_MODELS[0].id);
  const [datasetVersionId, setDatasetVersionId] = useState<string>("");
  const config: VlmTrainingConfig = useMemo(
    () => buildVlmTrainingConfig(presetId, baseModelId, datasetVersionId || versions[0]?.id || "未选择"),
    [presetId, baseModelId, datasetVersionId, versions],
  );
  const bundle = useMemo(() => buildVlmTrainingBundle(config), [config]);

  // —— Dry-run ——
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [dryRun, setDryRun] = useState<VlmDryRunReport | null>(null);
  function handleDryRun() {
    setDryRun(runVlmDryRun(config, userConfirmed));
  }

  function handleRecordExperiment() {
    if (!dryRun?.ok) return;
    const tokens = samples.reduce((a, s) => a + s.instruction.length + s.answer.length, 0);
    recordVlmExperiment({ config, imageSampleCount: stats.imageCount, textTokenCount: Math.round(tokens / 2) });
  }

  function downloadFile(path: string, content: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = path;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">AetherSeed-VL</div>
          <h1 className="text-2xl font-display">AetherSeed-VL 多模态训练流水线</h1>
          <p className="text-sm text-muted-foreground">
            私有图文模型 v0.1：投喂图文样本 → 构建数据集版本 → 选择底座 → 生成 LoRA / SFT / Adapter 配置 → dry-run → 本地网关执行。
            <span className="text-amber-600">
              默认不从零训练大型 VLM；不自动下载模型；不上传图片；执行训练必须人工确认。
            </span>
          </p>
        </header>

        {/* 概览 */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Card label="图文样本" value={stats.sampleCount} />
          <Card label="图片数" value={stats.imageCount} />
          <Card label="BLOCK 样本" value={stats.blockCount} accent />
          <Card label="平均质量" value={`${stats.averageQuality}/100`} />
          <Card label="UI 截图" value={stats.perType.UI_SCREENSHOT_QA} />
          <Card label="角色图" value={stats.perType.CHARACTER_IMAGE_QA} />
          <Card label="符号图" value={stats.perType.SYMBOL_IMAGE_QA} />
          <Card label="图表" value={stats.perType.DIAGRAM_IMAGE_QA} />
        </section>

        {/* 投喂 */}
        <section className="space-y-3 border border-border rounded-md p-4">
          <h2 className="text-base font-medium">① 图文训练投喂</h2>
          <p className="text-xs text-muted-foreground">
            支持 png/jpg/jpeg/webp/gif/svg；单图或多图 + 说明文本 + 标准答案。BLOCK 图片将自动剔除，不进入训练集。
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">样本类型</label>
              <select
                className="w-full border border-border rounded px-2 py-1 text-sm bg-background"
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value as VlmSampleType)}
              >
                {SAMPLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <label className="text-xs text-muted-foreground">图片（可多选）</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handlePickFiles(e.target.files)}
                className="text-xs"
              />
              {imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {imageUrls.map((u, i) => (
                    <img key={i} src={u} alt="预览" className="w-20 h-20 object-cover rounded border border-border" />
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">用户问题 / 指令</label>
              <textarea
                className="w-full border border-border rounded px-2 py-1 text-sm bg-background h-20"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
              <label className="text-xs text-muted-foreground">标准答案（assistant）</label>
              <textarea
                className="w-full border border-border rounded px-2 py-1 text-sm bg-background h-24"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="例如：这是 /system/datasets 页面，主要用于…，下一步建议…"
              />
              <button
                className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted disabled:opacity-50"
                onClick={handleCreateSample}
                disabled={!files.length || !answer.trim()}
              >
                生成图文训练样本
              </button>
            </div>
          </div>
        </section>

        {/* 样本列表 */}
        <section className="space-y-2 border border-border rounded-md p-4">
          <h2 className="text-base font-medium">② 已收录图文样本</h2>
          {samples.length === 0 ? (
            <p className="text-xs text-muted-foreground">暂无样本。先在上方添加一条 UI 截图问答试试。</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {samples.map((s) => (
                <li key={s.id} className="border border-border rounded p-2 flex gap-3">
                  <div className="flex gap-1">
                    {s.images.slice(0, 2).map((img) => (
                      <img
                        key={img.id}
                        src={img.localObjectUrl ?? ""}
                        alt={img.fileName}
                        className="w-14 h-14 object-cover rounded"
                      />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">
                      {s.sampleType}｜质量 {s.qualityScore}｜{s.safetyStatus}
                    </div>
                    <div className="text-xs truncate">指令：{s.instruction}</div>
                    <div className="text-xs truncate text-muted-foreground">答：{s.answer}</div>
                  </div>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => deleteVlmSample(s.id)}
                  >
                    删除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 数据集 + 导出 */}
        <section className="space-y-3 border border-border rounded-md p-4">
          <h2 className="text-base font-medium">③ 多模态数据集与导出</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted" onClick={handleBuildVersion}>
              构建 AetherSeed-VL 数据集版本
            </button>
            <select
              className="border border-border rounded px-2 py-1 text-sm bg-background"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as VlmExportFormat)}
            >
              <option value="VLM_CHATML">VLM ChatML</option>
              <option value="LLAVA_JSON">LLaVA JSON</option>
              <option value="IMAGE_FOLDER_METADATA">image-folder + metadata.jsonl</option>
              <option value="HF_VISION">HuggingFace Vision</option>
            </select>
            <button
              className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted disabled:opacity-50"
              disabled={!versions.length}
              onClick={handleExport}
            >
              生成导出包预览
            </button>
          </div>
          {versions.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-1">
              {versions.map((v) => (
                <li key={v.id}>
                  {v.name}｜样本 {v.sampleCount}｜图片 {v.imageCount}｜平均质量 {v.averageQuality}｜
                  {v.trainable ? "可用于训练" : "暂不可训练"}
                </li>
              ))}
            </ul>
          )}
          {exportPreview && (
            <pre className="text-xs bg-muted/40 p-3 rounded whitespace-pre-wrap">{exportPreview}</pre>
          )}
        </section>

        {/* 训练配置 */}
        <section className="space-y-3 border border-border rounded-md p-4">
          <h2 className="text-base font-medium">④ 本机训练配置（LoRA / SFT / Adapter）</h2>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div>
              <label className="text-xs text-muted-foreground">预设</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={presetId}
                onChange={(e) => setPresetId(e.target.value)}
              >
                {VLM_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">底座模型</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={baseModelId}
                onChange={(e) => setBaseModelId(e.target.value)}
              >
                {VLM_BASE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                    {m.recommended ? "（推荐）" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">数据集版本</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={datasetVersionId}
                onChange={(e) => setDatasetVersionId(e.target.value)}
              >
                <option value="">使用最新版本</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            训练方式：{config.trainingMethod}｜分辨率 {config.imageResolution}｜步数 {config.maxSteps}｜设备 {config.deviceMode}
            ｜混合精度 {config.mixedPrecision}
          </div>
          <div className="flex flex-wrap gap-2">
            {bundle.files.map((f) => (
              <button
                key={f.path}
                className="text-xs border border-border rounded px-2 py-1 hover:bg-muted"
                onClick={() => downloadFile(f.path, f.content)}
              >
                下载 {f.path}
              </button>
            ))}
          </div>
        </section>

        {/* Dry-run + 网关 */}
        <section className="space-y-3 border border-border rounded-md p-4">
          <h2 className="text-base font-medium">⑤ Dry-run 与本地执行网关</h2>
          <label className="text-xs flex items-center gap-2">
            <input type="checkbox" checked={userConfirmed} onChange={(e) => setUserConfirmed(e.target.checked)} />
            我已确认在本机执行训练，已检查数据来源与许可，不会上传任何图片或样本。
          </label>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted" onClick={handleDryRun}>
              执行 VLM dry-run
            </button>
            <button
              className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted disabled:opacity-50"
              disabled={!dryRun?.ok}
              onClick={handleRecordExperiment}
            >
              写入实验账本
            </button>
          </div>
          {dryRun && (
            <div className="text-xs space-y-1">
              <div className={dryRun.ok ? "text-emerald-600" : "text-amber-600"}>
                {dryRun.ok ? "dry-run 通过：可由用户在本地网关启动训练" : "dry-run 未通过，禁止执行训练"}
              </div>
              <ul className="space-y-0.5">
                {dryRun.checks.map((c) => (
                  <li key={c.name}>
                    {c.ok ? "✓" : "✗"} {c.name} — {c.detail}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            本地执行网关白名单：
            <ul className="mt-1 space-y-0.5 font-mono">
              {getVlmGatewayWhitelist().map((c) => (
                <li key={c}>· {c}</li>
              ))}
            </ul>
            <span className="text-amber-600">
              pip install 仍必须单独确认；禁止任意 shell 字符串拼接；不自动下载模型；不自动上传图片。
            </span>
          </div>
        </section>

        {/* 实验账本 / 血统线 */}
        <section className="space-y-2 border border-border rounded-md p-4">
          <h2 className="text-base font-medium">⑥ AetherSeed-VL 实验账本</h2>
          {experiments.length === 0 ? (
            <p className="text-xs text-muted-foreground">尚未记录实验。通过 dry-run 后可写入。</p>
          ) : (
            <ul className="text-xs space-y-1">
              {experiments.map((e) => (
                <li key={e.id}>
                  {e.lineage}｜{e.trainingMethod}｜底座 {e.baseModelId}｜样本 {e.imageSampleCount}｜tokens ~{e.textTokenCount}｜
                  {e.evalResult}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 推理接入 */}
        <section className="space-y-2 border border-border rounded-md p-4">
          <h2 className="text-base font-medium">⑦ 推理接入说明</h2>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>· Transformers 本地推理（默认）：直接加载底座 + LoRA Adapter。</li>
            <li>· llama.cpp / GGUF：取决于底座是否有 GGUF 转换路径与视觉组件支持。</li>
            <li>· Ollama：部分 VLM 可通过 Modelfile <code>FROM /path/to/file.gguf</code> 导入，但并非所有 VLM 都支持，不要假设全部 Ollama-ready。</li>
            <li>· Adapter-only：仅产出 LoRA 权重，需要在推理时与底座合并。</li>
          </ul>
        </section>

        {/* 联动入口 */}
        <section className="text-xs text-muted-foreground flex flex-wrap gap-3">
          <Link to="/system/intake-forge" className="underline">投喂炉</Link>
          <Link to="/system/datasets" className="underline">数据集</Link>
          <Link to="/system/local-training" className="underline">本机训练</Link>
          <Link to="/system/auto-training" className="underline">自动训练</Link>
          <Link to="/system/experiment-ledger" className="underline">实验账本</Link>
          <Link to="/system/data-engine" className="underline">数据引擎</Link>
          <Link to="/system/local-gateway" className="underline">本地执行网关</Link>
        </section>
      </div>
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="border border-border rounded p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-xl font-display mt-1 ${accent ? "text-amber-600" : ""}`}>{value}</div>
    </div>
  );
}
