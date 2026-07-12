// AetherSeed Local Training · 本机训练配置台 · /system/local-training
// v0.1 扩展：AetherSeed 300M 私有模型为默认主线
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
  LOCAL_TRAINING_MODE_LABEL,
  LOCAL_TRAINING_TARGET_LABEL,
  type LocalTrainingExperimentStatus,
  type LocalTrainingMode,
  type LocalTrainingTarget,
} from "@/lib/aetherseed-local-training/localTrainingTypes";
import {
  buildLocalTrainingPackageFiles,
  listLocalTrainingBundles,
  planLocalTraining,
} from "@/lib/aetherseed-local-training/localTrainingRuntime";
import {
  createExperimentFromPlan,
  listExperiments,
  updateExperiment,
} from "@/lib/aetherseed-local-training/localTrainingExperimentStore";
import { listDatasetVersions } from "@/lib/aetherseed-dataset/datasetBuilder";
import { DATASET_TYPE_LABEL } from "@/lib/aetherseed-dataset/datasetTypes";
import {
  LOCAL_TRAINING_SAFETY_ALLOWED,
  LOCAL_TRAINING_SAFETY_FORBIDDEN,
} from "@/lib/aetherseed-local-training/localTrainingSafetyPolicy";
import {
  downloadFilesSequentially,
  downloadTextFile,
  isBrowserDownloadSupported,
} from "@/lib/aetherseed-dataset/datasetBrowserDownload";
import {
  DURATION_PRESET_LABEL,
  HARDWARE_MODE_HINT,
  HARDWARE_MODE_LABEL,
  OUTPUT_FORMAT_LABEL,
  PRESET_300M_LIST,
  STEP_PRESET_LABEL,
  TRAINING_SCALE_LABEL,
  defaultExtendedOptionsFor,
  effectiveMaxSteps,
  effectiveMinutes,
  type DurationPreset,
  type HardwareMode,
  type LocalTrainingExtendedOptions,
  type OutputFormat,
  type Preset300mId,
  type StepPreset,
  type TrainingScale,
} from "@/lib/aetherseed-local-training/localTrainingExtendedOptions";
import { UnifiedGatewayStatusBar } from "@/components/system/UnifiedGatewayStatusBar";

export const Route = createFileRoute("/system/local-training")({
  head: () => ({
    meta: [
      { title: "本机训练配置台 · AetherSeed 300M" },
      {
        name: "description",
        content:
          "AetherSeed 300M 私有模型本机训练配置台：选择目标模型、数据集版本、训练方式、硬件模式、时长、checkpoint、输出格式，生成训练包与实验记录。不自动训练。",
      },
    ],
  }),
  component: LocalTrainingPage,
});

// 主线目标：300M 私有模型
const MAIN_TARGETS: LocalTrainingTarget[] = ["AETHERSEED_300M_PRIVATE"];
// 旧路线 / 高级折叠区
const LEGACY_TARGETS: LocalTrainingTarget[] = [
  "AETHERSEED_10M",
  "AETHERSEED_50M",
  "AETHERSEED_100M",
  "ROUTER_TINY",
  "MSL_TINY",
  "FORMAT_TINY",
];

const ALL_MODES: { mode: LocalTrainingMode; available: boolean; hint: string }[] = [
  { mode: "FROM_SCRATCH_TOY", available: true, hint: "冒烟训练：只验证链路能不能跑，不追求效果。" },
  { mode: "SFT_TINY", available: true, hint: "指令微调：让模型学会 Aetherworld 问答 / 总结 / 提示词生成。" },
  { mode: "SFT_ONLY", available: true, hint: "仅指令微调（SFT_ONLY）。" },
  {
    mode: "CONTINUED_PRETRAIN_PLUS_SFT",
    available: false,
    hint: "继续训练 + 指令微调（CPT + SFT）。推荐给 300M。脚本待补，不可用。",
  },
  { mode: "FORMAT_TUNING", available: true, hint: "格式强化：强化 JSON / MSL / Lovable Prompt 结构化输出。" },
  { mode: "ROUTER_TRAINING", available: true, hint: "Router 训练。" },
  { mode: "MSL_TRAINING", available: true, hint: "MSL 训练。" },
];

const HARDWARE_OPTIONS: HardwareMode[] = [
  "SHORT_TEST",
  "NIGHTLY_SLOW",
  "LOCAL_CPU_SLOW",
  "LOCAL_GPU",
  "SERVER_RESERVED",
];
const SCALE_OPTIONS: TrainingScale[] = ["SMOKE_SAMPLE", "DATASET_FULL", "CUSTOM_SAMPLE_LIMIT"];
const DURATION_OPTIONS: DurationPreset[] = ["TEST_10M", "TEST_1H", "NIGHT_6H", "NIGHT_12H", "LONG_24H", "CUSTOM"];
const STEP_OPTIONS: StepPreset[] = ["AUTO", "S_100", "S_500", "S_1000", "CUSTOM"];
const OUTPUT_OPTIONS: OutputFormat[] = [
  "HUGGINGFACE_CHECKPOINT",
  "SAFETENSORS",
  "GGUF_RESERVED",
  "OLLAMA_MODELFILE_RESERVED",
  "TRAIN_LOG",
  "EVAL_REPORT",
];

const EXP_STATUSES: LocalTrainingExperimentStatus[] = [
  "DRAFT",
  "READY_TO_RUN",
  "RUNNING_MANUAL",
  "COMPLETED_MANUAL",
  "FAILED_MANUAL",
  "EVALUATED",
];

const STATUS_COLOR: Record<string, string> = {
  PASS: "text-emerald-500 border-emerald-500/40",
  WARN: "text-amber-500 border-amber-500/40",
  BLOCK: "text-rose-500 border-rose-500/40",
  DRAFT: "text-muted-foreground border-border/40",
  READY_TO_RUN: "text-sky-400 border-sky-500/40",
  RUNNING_MANUAL: "text-violet-400 border-violet-500/40",
  COMPLETED_MANUAL: "text-emerald-500 border-emerald-500/40",
  FAILED_MANUAL: "text-rose-400 border-rose-500/40",
  EVALUATED: "text-amber-400 border-amber-500/40",
};

function LocalTrainingPage() {
  const datasets = listDatasetVersions();
  const usableDatasets = useMemo(
    () => datasets.filter((d) => d.safetyStatus !== "BLOCK"),
    [datasets],
  );
  const [datasetId, setDatasetId] = useState<string>(usableDatasets[0]?.id ?? "");
  const [evalDatasetId, setEvalDatasetId] = useState<string>("");
  const [target, setTarget] = useState<LocalTrainingTarget>("AETHERSEED_300M_PRIVATE");
  const [mode, setMode] = useState<LocalTrainingMode | "">("");
  const [name, setName] = useState("");
  const [tick, setTick] = useState(0);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [showLegacy, setShowLegacy] = useState(false);
  const [ext, setExt] = useState<LocalTrainingExtendedOptions>(() =>
    defaultExtendedOptionsFor("AETHERSEED_300M_PRIVATE"),
  );
  const [activePreset, setActivePreset] = useState<Preset300mId | "">("PRESET_300M_SMOKE");

  const supported = isBrowserDownloadSupported();

  const bundles = useMemo(() => {
    void tick;
    return listLocalTrainingBundles();
  }, [tick]);
  const experiments = useMemo(() => {
    void tick;
    return listExperiments();
  }, [tick]);
  const active = useMemo(
    () => bundles.find((b) => b.plan.id === activePlanId) ?? bundles[0],
    [bundles, activePlanId],
  );
  const selectedDataset = usableDatasets.find((d) => d.id === datasetId);

  const applyPreset = useCallback((id: Preset300mId) => {
    const p = PRESET_300M_LIST.find((x) => x.id === id);
    if (!p) return;
    setTarget("AETHERSEED_300M_PRIVATE");
    setMode(p.mode);
    setExt({ ...p.options });
    setActivePreset(id);
    setStatus(`已套用预设：${p.name}`);
  }, []);

  const updateExt = useCallback(<K extends keyof LocalTrainingExtendedOptions>(
    key: K,
    value: LocalTrainingExtendedOptions[K],
  ) => {
    setExt((prev) => ({ ...prev, [key]: value }));
    setActivePreset("");
  }, []);

  const updateCheckpoint = useCallback(
    <K extends keyof LocalTrainingExtendedOptions["checkpoint"]>(
      key: K,
      value: LocalTrainingExtendedOptions["checkpoint"][K],
    ) => {
      setExt((prev) => ({ ...prev, checkpoint: { ...prev.checkpoint, [key]: value } }));
      setActivePreset("");
    },
    [],
  );

  const toggleOutput = useCallback((f: OutputFormat) => {
    setExt((prev) => {
      const has = prev.outputFormats.includes(f);
      return {
        ...prev,
        outputFormats: has ? prev.outputFormats.filter((x) => x !== f) : [...prev.outputFormats, f],
      };
    });
    setActivePreset("");
  }, []);

  const handleBuild = useCallback(() => {
    if (!selectedDataset) {
      setStatus("请先在 /system/datasets 构建至少一个数据集版本。");
      return;
    }
    if (selectedDataset.safetyStatus === "BLOCK") {
      setStatus("数据集安全状态为 BLOCK，不允许用于本机训练。");
      return;
    }
    const evalDataset = usableDatasets.find((d) => d.id === evalDatasetId);
    const presetName = PRESET_300M_LIST.find((p) => p.id === activePreset)?.name;
    const bundle = planLocalTraining({
      name: name.trim() || undefined,
      target,
      mode: mode || undefined,
      dataset: selectedDataset,
      evalDataset: evalDataset && evalDataset.safetyStatus !== "BLOCK" ? evalDataset : undefined,
      extendedOptions: ext,
      presetName,
    });
    setActivePlanId(bundle.plan.id);
    setTick((n) => n + 1);
    setStatus(`已生成训练草案：${bundle.plan.name}`);
  }, [selectedDataset, usableDatasets, evalDatasetId, name, target, mode, ext, activePreset]);

  const handleCreateExperiment = useCallback(() => {
    if (!active) return;
    const exp = createExperimentFromPlan(active.plan);
    setTick((n) => n + 1);
    setStatus(`已创建实验记录 ${exp.id}（READY_TO_RUN）`);
  }, [active]);

  const handleDownloadPackage = useCallback(async () => {
    if (!active) return;
    const files = buildLocalTrainingPackageFiles(active);
    const r = await downloadFilesSequentially(files, 350);
    setStatus(`完整训练包：触发下载 ${r.success}/${r.total} 个文件`);
  }, [active]);

  const handleDownloadOne = (fileName: string, content: string, mime: string) => () => {
    const ok = downloadTextFile({ fileName, content, mimeType: mime });
    setStatus(ok ? `${fileName}：已触发下载` : `${fileName}：浏览器不支持下载`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          AetherSeed Local Training Config Expansion v0.1
        </div>
        <h1 className="text-2xl font-semibold">本机训练配置台</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          主线目标：<span className="text-foreground">AetherSeed 300M 私有模型</span>。
          本页只生成训练计划 / 配置 / 脚本 / Runbook / 实验记录草案；不会自动执行任何训练命令，不上传数据，不下载模型。
        </p>
      </header>

      <UnifiedGatewayStatusBar prefix="本机训练前置：" />



      {/* ① 300M 预设 */}
      <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs text-emerald-300">① AetherSeed 300M 预设（推荐第一炉先选「冒烟测试」）</div>
          <div className="text-[10px] text-muted-foreground">
            当前预设：{activePreset ? PRESET_300M_LIST.find((p) => p.id === activePreset)?.name : "自定义"}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESET_300M_LIST.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className={`text-left rounded-md border p-2.5 text-[11px] space-y-1 transition ${
                activePreset === p.id
                  ? "border-emerald-500/70 bg-emerald-500/15"
                  : "border-border/50 bg-card/40 hover:border-emerald-500/40"
              }`}
            >
              <div className="text-foreground/90 text-xs">{p.name}</div>
              <div className="text-muted-foreground leading-relaxed">{p.purpose}</div>
              <div className="text-[10px] text-muted-foreground">
                {HARDWARE_MODE_LABEL[p.options.hardwareMode]} ·{" "}
                {DURATION_PRESET_LABEL[p.options.durationPreset]}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ② 目标模型 + 数据集 */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
        <div className="text-xs text-muted-foreground">② 目标模型 与 数据集版本</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select
            value={target}
            onChange={(e) => {
              const t = e.target.value as LocalTrainingTarget;
              setTarget(t);
              if (t !== "AETHERSEED_300M_PRIVATE") {
                setExt(defaultExtendedOptionsFor(t));
                setActivePreset("");
              }
            }}
            className="text-xs bg-background/60 border border-border/50 rounded-md p-2"
          >
            <optgroup label="主线（推荐）">
              {MAIN_TARGETS.map((t) => (
                <option key={t} value={t}>
                  {LOCAL_TRAINING_TARGET_LABEL[t]}
                </option>
              ))}
            </optgroup>
            {showLegacy && (
              <optgroup label="高级 / 旧路线（不推荐第一炉）">
                {LEGACY_TARGETS.map((t) => (
                  <option key={t} value={t}>
                    {LOCAL_TRAINING_TARGET_LABEL[t]}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <select
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            className="text-xs bg-background/60 border border-border/50 rounded-md p-2"
          >
            {usableDatasets.length === 0 && <option value="">（无可用数据集）</option>}
            {usableDatasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.version} · {DATASET_TYPE_LABEL[d.datasetType]} · {d.sampleCount} 条 · {d.safetyStatus}
              </option>
            ))}
          </select>
          <select
            value={evalDatasetId}
            onChange={(e) => setEvalDatasetId(e.target.value)}
            className="text-xs bg-background/60 border border-border/50 rounded-md p-2"
          >
            <option value="">（不指定评测集）</option>
            {usableDatasets.map((d) => (
              <option key={d.id} value={d.id}>
                EVAL · {d.name} · {d.version}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <button
            onClick={() => setShowLegacy((v) => !v)}
            className="px-2 py-1 rounded-md border border-border/50 text-muted-foreground hover:bg-muted/30"
          >
            {showLegacy ? "隐藏" : "显示"}高级 / 旧路线（Tiny / 10M / 50M / 100M）
          </button>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="训练计划名称（可选，默认按目标模型自动命名）"
            className="flex-1 min-w-[200px] bg-background/60 border border-border/50 rounded-md p-1.5"
          />
        </div>
        {selectedDataset ? (
          <div className="text-[11px] text-muted-foreground border border-dashed border-border/50 rounded-md p-2">
            当前数据集：{selectedDataset.name} {selectedDataset.version} · 类型 {DATASET_TYPE_LABEL[selectedDataset.datasetType]} ·
            样本 {selectedDataset.sampleCount} 条 · 评测 {selectedDataset.evalSampleIds.length} 条 ·
            平均质量 {(selectedDataset.qualityScore * 100).toFixed(0)}% · 安全 {selectedDataset.safetyStatus} ·
            是否适合 300M：{selectedDataset.sampleCount >= 50 ? "建议（>=50 条）" : "样本不足，建议补足后再开第一炉"}
          </div>
        ) : (
          <div className="text-[11px] text-amber-400 border border-amber-500/30 rounded-md p-2">
            当前有样本池，但尚未封版。请先在
            <Link to="/system/datasets" className="underline mx-1">/system/datasets</Link>
            构建数据集版本。
          </div>
        )}
      </section>

      {/* ③ 训练方式 + 硬件 + 规模 + 时长 + 步数 */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
        <div className="text-xs text-muted-foreground">③ 训练方式 / 硬件 / 规模 / 时长 / 步数</div>

        <div>
          <div className="text-[11px] text-muted-foreground mb-1">训练方式</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {ALL_MODES.map((m) => {
              const selected = mode === m.mode;
              return (
                <button
                  key={m.mode}
                  disabled={!m.available}
                  onClick={() => setMode(m.mode)}
                  className={`text-left rounded-md border p-2 text-[11px] transition ${
                    selected
                      ? "border-emerald-500/60 bg-emerald-500/10"
                      : m.available
                        ? "border-border/40 bg-muted/10 hover:border-border/70"
                        : "border-border/30 bg-muted/5 opacity-50 cursor-not-allowed"
                  }`}
                  title={m.hint}
                >
                  <div className="text-foreground/90">{LOCAL_TRAINING_MODE_LABEL[m.mode]}</div>
                  <div className="text-muted-foreground text-[10px] leading-relaxed">
                    {m.hint}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FieldBlock label="硬件模式">
            <select
              value={ext.hardwareMode}
              onChange={(e) => updateExt("hardwareMode", e.target.value as HardwareMode)}
              className="text-xs bg-background/60 border border-border/50 rounded-md p-2 w-full"
            >
              {HARDWARE_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {HARDWARE_MODE_LABEL[h]} — {HARDWARE_MODE_HINT[h]}
                </option>
              ))}
            </select>
            <div className="text-[10px] text-muted-foreground mt-1">
              当前无法自动检测硬件，请按保守模式生成配置。
            </div>
          </FieldBlock>

          <FieldBlock label="训练规模">
            <select
              value={ext.trainingScale}
              onChange={(e) => updateExt("trainingScale", e.target.value as TrainingScale)}
              className="text-xs bg-background/60 border border-border/50 rounded-md p-2 w-full"
            >
              {SCALE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {TRAINING_SCALE_LABEL[s]}
                </option>
              ))}
            </select>
            {ext.trainingScale === "CUSTOM_SAMPLE_LIMIT" && (
              <input
                type="number"
                min={1}
                value={ext.customSampleLimit ?? 200}
                onChange={(e) => updateExt("customSampleLimit", Number(e.target.value))}
                className="text-xs bg-background/60 border border-border/50 rounded-md p-2 w-full mt-1"
                placeholder="自定义样本上限"
              />
            )}
          </FieldBlock>

          <FieldBlock label="训练时长">
            <select
              value={ext.durationPreset}
              onChange={(e) => updateExt("durationPreset", e.target.value as DurationPreset)}
              className="text-xs bg-background/60 border border-border/50 rounded-md p-2 w-full"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {DURATION_PRESET_LABEL[d]}
                </option>
              ))}
            </select>
            {ext.durationPreset === "CUSTOM" && (
              <input
                type="number"
                min={1}
                value={ext.customMinutes ?? 30}
                onChange={(e) => updateExt("customMinutes", Number(e.target.value))}
                className="text-xs bg-background/60 border border-border/50 rounded-md p-2 w-full mt-1"
                placeholder="自定义分钟数"
              />
            )}
            <div className="text-[10px] text-muted-foreground mt-1">
              生效时长：{effectiveMinutes(ext)} 分钟
            </div>
          </FieldBlock>

          <FieldBlock label="训练步数">
            <select
              value={ext.stepPreset}
              onChange={(e) => updateExt("stepPreset", e.target.value as StepPreset)}
              className="text-xs bg-background/60 border border-border/50 rounded-md p-2 w-full"
            >
              {STEP_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STEP_PRESET_LABEL[s]}
                </option>
              ))}
            </select>
            {ext.stepPreset === "CUSTOM" && (
              <input
                type="number"
                min={10}
                value={ext.customSteps ?? 100}
                onChange={(e) => updateExt("customSteps", Number(e.target.value))}
                className="text-xs bg-background/60 border border-border/50 rounded-md p-2 w-full mt-1"
                placeholder="自定义步数"
              />
            )}
            <div className="text-[10px] text-muted-foreground mt-1">
              生效步数：{(() => { const s = effectiveMaxSteps(ext); return s === "AUTO" ? "自动估算" : String(s); })()}
            </div>
          </FieldBlock>
        </div>
      </section>

      {/* ④ checkpoint */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
        <div className="text-xs text-muted-foreground">④ checkpoint 设置（300M 必须高频保存）</div>
        <div className="text-[10px] text-amber-400">
          300M 本机训练必须依赖 checkpoint，不建议长时间无保存运行。
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <NumberField
            label="每多少 step 保存"
            value={ext.checkpoint.saveEverySteps}
            onChange={(v) => updateCheckpoint("saveEverySteps", v)}
          />
          <NumberField
            label="每多少分钟保存"
            value={ext.checkpoint.saveEveryMinutes}
            onChange={(v) => updateCheckpoint("saveEveryMinutes", v)}
          />
          <NumberField
            label="最多保留 checkpoint 数"
            value={ext.checkpoint.saveTotalLimit}
            onChange={(v) => updateCheckpoint("saveTotalLimit", v)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
          <label className="flex items-center gap-2 border border-border/40 bg-muted/10 rounded-md p-2">
            <input
              type="checkbox"
              checked={ext.checkpoint.resumeAllowed}
              onChange={(e) => updateCheckpoint("resumeAllowed", e.target.checked)}
            />
            <span>允许从 checkpoint 恢复训练</span>
          </label>
          <input
            value={ext.checkpoint.resumeFromCheckpoint ?? ""}
            onChange={(e) =>
              updateCheckpoint("resumeFromCheckpoint", e.target.value || undefined)
            }
            placeholder="恢复来源 checkpoint（可选，本机路径）"
            className="bg-background/60 border border-border/50 rounded-md p-2"
          />
          <input
            value={ext.checkpoint.checkpointDir}
            onChange={(e) => updateCheckpoint("checkpointDir", e.target.value)}
            placeholder="checkpoint 输出目录"
            className="bg-background/60 border border-border/50 rounded-md p-2"
          />
        </div>
      </section>

      {/* ⑤ 输出格式 + Ollama */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
        <div className="text-xs text-muted-foreground">⑤ 输出格式 与 Ollama 接入准备</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
          {OUTPUT_OPTIONS.map((f) => {
            const checked = ext.outputFormats.includes(f);
            return (
              <label
                key={f}
                className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${
                  checked ? "border-emerald-500/50 bg-emerald-500/10" : "border-border/40 bg-muted/10"
                }`}
              >
                <input type="checkbox" checked={checked} onChange={() => toggleOutput(f)} />
                <span>{OUTPUT_FORMAT_LABEL[f]}</span>
              </label>
            );
          })}
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <span className="text-muted-foreground">Ollama 目标名称</span>
          <input
            value={ext.ollamaTargetTag}
            onChange={(e) => updateExt("ollamaTargetTag", e.target.value)}
            className="flex-1 min-w-[200px] bg-background/60 border border-border/50 rounded-md p-1.5"
            placeholder="aetherseed-300m"
          />
        </div>
        <div className="text-[10px] text-muted-foreground">
          训练包将自动生成 <code>README_ollama_export.md</code>，包含 HF → GGUF → Modelfile →{" "}
          <code>ollama create</code> 的完整本机手动步骤。系统不会自动执行。
        </div>
      </section>

      {/* ⑥ 生成 */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs text-muted-foreground">⑥ 生成本机训练草案</div>
          <button
            onClick={handleBuild}
            disabled={!datasetId}
            className="text-xs px-3 py-1.5 rounded-md border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40"
          >
            生成本机训练草案
          </button>
        </div>
        {status && <div className="text-[11px] text-muted-foreground">{status}</div>}
      </section>

      {/* ⑦ 草案列表 */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
        <div className="text-xs text-muted-foreground">⑦ 训练草案（{bundles.length}）</div>
        {bundles.length === 0 ? (
          <div className="text-[11px] text-muted-foreground border border-dashed border-border/50 rounded-md p-4 text-center">
            还未生成任何本机训练草案。
          </div>
        ) : (
          <div className="space-y-1.5">
            {bundles.map((b) => (
              <button
                key={b.plan.id}
                onClick={() => setActivePlanId(b.plan.id)}
                className={`w-full text-left rounded-md border p-2 text-[11px] space-y-1 transition ${
                  active?.plan.id === b.plan.id
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : "border-border/40 bg-muted/10 hover:border-border/70"
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-foreground/90">{b.plan.name}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    {LOCAL_TRAINING_TARGET_LABEL[b.plan.targetModel]}
                  </span>
                  <span
                    className={`ml-auto px-1.5 py-0.5 rounded-full border text-[10px] ${
                      STATUS_COLOR[b.plan.safetyStatus]
                    }`}
                  >
                    {b.plan.safetyStatus}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  模式 {LOCAL_TRAINING_MODE_LABEL[b.plan.trainingMode]} ·{" "}
                  {HARDWARE_MODE_LABEL[b.extendedOptions.hardwareMode]} ·{" "}
                  {effectiveMinutes(b.extendedOptions)} 分钟 · Ollama:{" "}
                  {b.extendedOptions.ollamaTargetTag}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ⑧ 训练配置 + 训练包 */}
      {active && (
        <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
          <div className="text-xs text-muted-foreground">
            ⑧ 训练配置与本机训练包 · {active.plan.name}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
            <Info k="隐藏维度" v={active.config.modelConfig.hiddenSize} />
            <Info k="层数" v={active.config.modelConfig.numLayers} />
            <Info k="头数" v={active.config.modelConfig.numHeads} />
            <Info k="上下文" v={active.config.modelConfig.contextLength} />
            <Info k="参数估计" v={active.config.modelConfig.parameterEstimate} />
            <Info k="epochs" v={active.config.trainingConfig.epochs} />
            <Info k="batch_size" v={active.config.trainingConfig.batchSize} />
            <Info k="lr" v={active.config.trainingConfig.learningRate} />
            <Info k="硬件" v={HARDWARE_MODE_LABEL[active.extendedOptions.hardwareMode]} />
            <Info k="时长" v={`${effectiveMinutes(active.extendedOptions)} 分钟`} />
            <Info
              k="最大步数"
              v={(() => { const s = effectiveMaxSteps(active.extendedOptions); return s === "AUTO" ? "自动" : String(s); })()}
            />
            <Info k="Ollama" v={active.extendedOptions.ollamaTargetTag} />
          </div>

          <div className="flex flex-wrap gap-2">
            {!supported && (
              <div className="text-[11px] text-amber-400">当前环境不支持浏览器下载。</div>
            )}
            <button
              onClick={handleDownloadPackage}
              disabled={!supported}
              className="text-xs px-3 py-1.5 rounded-md border border-foreground/40 text-foreground hover:bg-foreground/5 disabled:opacity-40"
            >
              下载完整本机训练包（多文件）
            </button>
            <button
              onClick={handleDownloadOne("config.yaml", active.files.configYaml, "text/yaml")}
              disabled={!supported}
              className="text-xs px-3 py-1.5 rounded-md border border-sky-500/40 text-sky-400 hover:bg-sky-500/10 disabled:opacity-40"
            >
              config.yaml
            </button>
            <button
              onClick={handleDownloadOne("train.py", active.files.trainPy, "text/x-python")}
              disabled={!supported}
              className="text-xs px-3 py-1.5 rounded-md border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40"
            >
              train.py
            </button>
            <button
              onClick={handleDownloadOne("eval.py", active.files.evalPy, "text/x-python")}
              disabled={!supported}
              className="text-xs px-3 py-1.5 rounded-md border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 disabled:opacity-40"
            >
              eval.py
            </button>
            <button
              onClick={handleDownloadOne("check_env.py", active.files.checkEnvPy, "text/x-python")}
              disabled={!supported}
              className="text-xs px-3 py-1.5 rounded-md border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-40"
            >
              check_env.py
            </button>
            <button
              onClick={handleDownloadOne("requirements.txt", active.files.requirementsTxt, "text/plain")}
              disabled={!supported}
              className="text-xs px-3 py-1.5 rounded-md border border-border/60 text-muted-foreground hover:bg-muted/30 disabled:opacity-40"
            >
              requirements.txt
            </button>
            <button
              onClick={handleDownloadOne("README_local_training.md", active.files.readmeMd, "text/markdown")}
              disabled={!supported}
              className="text-xs px-3 py-1.5 rounded-md border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 disabled:opacity-40"
            >
              README
            </button>
            <button
              onClick={handleDownloadOne("README_ollama_export.md", active.files.ollamaReadmeMd, "text/markdown")}
              disabled={!supported}
              className="text-xs px-3 py-1.5 rounded-md border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40"
            >
              Ollama README
            </button>
          </div>

          {/* 跳转联动 */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40">
            <Link
              to="/system/auto-training"
              className="text-[11px] px-2 py-1 rounded-md border border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
            >
              生成自动训练 dry-run →
            </Link>
            <Link
              to="/system/experiment-ledger"
              className="text-[11px] px-2 py-1 rounded-md border border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            >
              打开实验账本 →
            </Link>
            <Link
              to="/system/training-workflows"
              className="text-[11px] px-2 py-1 rounded-md border border-violet-500/40 text-violet-400 hover:bg-violet-500/10"
            >
              加入训练工作流 →
            </Link>
            <Link
              to="/system/local-gateway"
              className="text-[11px] px-2 py-1 rounded-md border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            >
              打开本地执行网关 →
            </Link>
            <Link
              to="/system/first-run-readiness"
              className="text-[11px] px-2 py-1 rounded-md border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
            >
              打开第一炉准备 →
            </Link>
          </div>

          <details className="text-[11px]">
            <summary className="cursor-pointer text-muted-foreground">config.yaml 预览</summary>
            <pre className="mt-1 text-[10px] text-foreground/80 bg-background/60 border border-border/40 rounded-md p-2 overflow-auto max-h-64 whitespace-pre">{active.files.configYaml}</pre>
          </details>
          <details className="text-[11px]">
            <summary className="cursor-pointer text-muted-foreground">README_ollama_export.md 预览</summary>
            <pre className="mt-1 text-[10px] text-foreground/80 bg-background/60 border border-border/40 rounded-md p-2 overflow-auto max-h-64 whitespace-pre-wrap">{active.files.ollamaReadmeMd}</pre>
          </details>
          <details className="text-[11px]">
            <summary className="cursor-pointer text-muted-foreground">runbook.md 预览</summary>
            <pre className="mt-1 text-[10px] text-foreground/80 bg-background/60 border border-border/40 rounded-md p-2 overflow-auto max-h-64 whitespace-pre-wrap">{active.files.runbookMd}</pre>
          </details>
        </section>
      )}

      {/* ⑨ 实验记录 */}
      {active && (
        <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs text-muted-foreground">⑨ 实验记录 · {active.plan.name}</div>
            <button
              onClick={handleCreateExperiment}
              className="text-xs px-2 py-1 rounded-md border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            >
              创建实验记录
            </button>
          </div>
          <ExperimentList
            planId={active.plan.id}
            experiments={experiments}
            onChange={() => setTick((n) => n + 1)}
          />
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            说明：实验状态由 Founder 手动维护。系统不会自动把状态推进到 COMPLETED_MANUAL；
            训练完成后请回到这里手动登记 outputArtifactPath / evalSummary，并参考 README_ollama_export.md 准备 Ollama 接入。
          </div>
        </section>
      )}

      {/* ⑩ 安全策略 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="text-emerald-400 mb-1">允许</div>
          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
            {LOCAL_TRAINING_SAFETY_ALLOWED.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-3">
          <div className="text-rose-400 mb-1">禁止</div>
          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
            {LOCAL_TRAINING_SAFETY_FORBIDDEN.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
            <li>不自动训练，不跳过 dry-run，不跳过用户确认。</li>
            <li>不上传任何数据，不下载任何模型，不执行任意 shell。</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-[11px] space-y-1">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value)))}
        className="w-full bg-background/60 border border-border/50 rounded-md p-1.5"
      />
    </label>
  );
}

function Info({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/10 p-2">
      <div className="text-muted-foreground">{k}</div>
      <div className="text-foreground/90 break-all">{v}</div>
    </div>
  );
}

function ExperimentList({
  planId,
  experiments,
  onChange,
}: {
  planId: string;
  experiments: ReturnType<typeof listExperiments>;
  onChange: () => void;
}) {
  const list = experiments.filter((e) => e.planId === planId);
  if (list.length === 0) {
    return (
      <div className="text-[11px] text-muted-foreground border border-dashed border-border/50 rounded-md p-3 text-center">
        还没有实验记录。点上面「创建实验记录」开始。
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {list.map((e) => (
        <div key={e.id} className="rounded-md border border-border/40 bg-muted/10 p-2 text-[11px] space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-foreground/90">{e.id}</span>
            <span className="text-muted-foreground">· 创建 {new Date(e.createdAt).toLocaleString("zh-CN")}</span>
            <span
              className={`ml-auto px-1.5 py-0.5 rounded-full border text-[10px] ${
                STATUS_COLOR[e.status]
              }`}
            >
              {e.status}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
            <select
              value={e.status}
              onChange={(ev) => {
                updateExperiment(e.id, {
                  status: ev.target.value as LocalTrainingExperimentStatus,
                });
                onChange();
              }}
              className="text-[11px] bg-background/60 border border-border/50 rounded-md p-1"
            >
              {EXP_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              defaultValue={e.outputArtifactPath ?? ""}
              onBlur={(ev) => {
                if (ev.target.value !== (e.outputArtifactPath ?? "")) {
                  updateExperiment(e.id, { outputArtifactPath: ev.target.value });
                  onChange();
                }
              }}
              placeholder="outputArtifactPath（本机路径，不上传）"
              className="text-[11px] bg-background/60 border border-border/50 rounded-md p-1"
            />
            <input
              defaultValue={e.evalSummary ?? ""}
              onBlur={(ev) => {
                if (ev.target.value !== (e.evalSummary ?? "")) {
                  updateExperiment(e.id, { evalSummary: ev.target.value });
                  onChange();
                }
              }}
              placeholder="evalSummary（手动填写评测摘要）"
              className="text-[11px] bg-background/60 border border-border/50 rounded-md p-1"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
