// AetherSeed Local Training · 运行时（不执行训练，只编排草案生成）
import type { DatasetVersion } from "@/lib/aetherseed-dataset/datasetTypes";
import {
  type LocalTrainingConfig,
  type LocalTrainingEvalPlan,
  type LocalTrainingExperiment,
  type LocalTrainingMode,
  type LocalTrainingPlan,
  type LocalTrainingRunbook,
  type LocalTrainingTarget,
} from "./localTrainingTypes";
import { buildLocalTrainingPlan } from "./localTrainingPlanBuilder";
import { buildLocalTrainingConfig, configToYaml } from "./localTrainingConfigBuilder";
import {
  buildEvalPy,
  buildLocalTrainingReadme,
  buildRequirementsTxt,
  buildTrainPy,
} from "./localTrainingScriptBuilder";
import { buildLocalTrainingRunbook, runbookToMarkdown } from "./localTrainingRunbookBuilder";
import { buildLocalTrainingEvalPlan } from "./localTrainingEvalPlanBuilder";
import { createExperimentFromPlan } from "./localTrainingExperimentStore";
import type { DownloadFile } from "@/lib/aetherseed-dataset/datasetBrowserDownload";
import {
  type LocalTrainingExtendedOptions,
  defaultExtendedOptionsFor,
} from "./localTrainingExtendedOptions";
import {
  buildCheckEnvPy,
  buildOllamaExportReadme,
  buildRunbookExtendedNotes,
} from "./localTraining300mExtraBuilders";

export interface LocalTrainingBundle {
  plan: LocalTrainingPlan;
  config: LocalTrainingConfig;
  runbook: LocalTrainingRunbook;
  evalPlan: LocalTrainingEvalPlan;
  extendedOptions: LocalTrainingExtendedOptions;
  files: {
    trainPy: string;
    evalPy: string;
    configYaml: string;
    requirementsTxt: string;
    readmeMd: string;
    runbookMd: string;
    checkEnvPy: string;
    ollamaReadmeMd: string;
  };
}

const STORE = new Map<string, LocalTrainingBundle>();

export function planLocalTraining(input: {
  name?: string;
  target: LocalTrainingTarget;
  mode?: LocalTrainingMode;
  dataset: DatasetVersion;
  evalDataset?: DatasetVersion;
  trainFileName?: string;
  evalFileName?: string;
  extendedOptions?: LocalTrainingExtendedOptions;
  presetName?: string;
}): LocalTrainingBundle {
  const plan = buildLocalTrainingPlan({
    name: input.name,
    target: input.target,
    mode: input.mode,
    dataset: input.dataset,
    evalDataset: input.evalDataset,
  });
  const trainFile = input.trainFileName ?? "train.jsonl";
  const evalFile = input.evalFileName ?? (input.evalDataset ? "eval.jsonl" : undefined);
  const cfg = buildLocalTrainingConfig(plan, trainFile, evalFile, "jsonl");
  const runbook = buildLocalTrainingRunbook(plan, cfg);
  const evalPlan = buildLocalTrainingEvalPlan(plan, evalFile);
  const ext = input.extendedOptions ?? defaultExtendedOptionsFor(input.target);

  // 把扩展配置注入 runbook
  runbook.steps = [
    ...runbook.steps,
    ...(input.presetName ? [`使用预设：${input.presetName}`] : []),
    "执行 python check_env.py 验证环境",
    "训练完成后参考 README_ollama_export.md 进行 Ollama 接入准备",
  ];
  runbook.safetyNotes = [
    ...runbook.safetyNotes,
    "300M 本机训练必须依赖 checkpoint，不建议长时间无保存运行。",
    "Ollama 接入仅作为最终私有发布，模型不开源不公开。",
    ...buildRunbookExtendedNotes(ext),
  ];

  const bundle: LocalTrainingBundle = {
    plan,
    config: cfg,
    runbook,
    evalPlan,
    extendedOptions: ext,
    files: {
      trainPy: buildTrainPy(plan, cfg),
      evalPy: buildEvalPy(plan),
      configYaml: configToYaml(cfg, plan) + "\n" + extendedOptionsToYaml(ext),
      requirementsTxt: buildRequirementsTxt(),
      readmeMd: buildLocalTrainingReadme(plan, cfg),
      runbookMd: runbookToMarkdown(runbook),
      checkEnvPy: buildCheckEnvPy(),
      ollamaReadmeMd: buildOllamaExportReadme(plan, ext),
    },
  };
  STORE.set(plan.id, bundle);
  return bundle;
}

function extendedOptionsToYaml(ext: LocalTrainingExtendedOptions): string {
  const lines: string[] = [];
  lines.push(`# ===== 扩展配置（300M 主线） =====`);
  lines.push(`extended:`);
  lines.push(`  hardware_mode: "${ext.hardwareMode}"`);
  lines.push(`  training_scale: "${ext.trainingScale}"`);
  if (ext.customSampleLimit !== undefined) lines.push(`  custom_sample_limit: ${ext.customSampleLimit}`);
  lines.push(`  duration_preset: "${ext.durationPreset}"`);
  if (ext.customMinutes !== undefined) lines.push(`  custom_minutes: ${ext.customMinutes}`);
  lines.push(`  step_preset: "${ext.stepPreset}"`);
  if (ext.customSteps !== undefined) lines.push(`  custom_steps: ${ext.customSteps}`);
  lines.push(`  checkpoint:`);
  lines.push(`    save_every_steps: ${ext.checkpoint.saveEverySteps}`);
  lines.push(`    save_every_minutes: ${ext.checkpoint.saveEveryMinutes}`);
  lines.push(`    save_total_limit: ${ext.checkpoint.saveTotalLimit}`);
  lines.push(`    resume_allowed: ${ext.checkpoint.resumeAllowed}`);
  if (ext.checkpoint.resumeFromCheckpoint) lines.push(`    resume_from: "${ext.checkpoint.resumeFromCheckpoint}"`);
  lines.push(`    checkpoint_dir: "${ext.checkpoint.checkpointDir}"`);
  lines.push(`  output_formats:`);
  for (const f of ext.outputFormats) lines.push(`    - "${f}"`);
  lines.push(`  ollama_target_tag: "${ext.ollamaTargetTag}"`);
  return lines.join("\n");
}

export function listLocalTrainingBundles(): LocalTrainingBundle[] {
  return Array.from(STORE.values()).sort((a, b) => b.plan.createdAt.localeCompare(a.plan.createdAt));
}

export function getLocalTrainingBundle(planId: string): LocalTrainingBundle | undefined {
  return STORE.get(planId);
}

export function createExperimentForPlan(planId: string): LocalTrainingExperiment | undefined {
  const b = STORE.get(planId);
  if (!b) return undefined;
  return createExperimentFromPlan(b.plan);
}

function safeName(n: string): string {
  return n.replace(/[^\w\u4e00-\u9fa5-]+/g, "_");
}

/** 生成本机训练包多文件下载内容（不打 zip）。 */
export function buildLocalTrainingPackageFiles(bundle: LocalTrainingBundle): DownloadFile[] {
  const base = `AetherSeed_LocalTraining_${safeName(bundle.plan.name)}_${bundle.plan.id}`;
  return [
    { fileName: `${base}__train.py`, content: bundle.files.trainPy, mimeType: "text/x-python" },
    { fileName: `${base}__eval.py`, content: bundle.files.evalPy, mimeType: "text/x-python" },
    { fileName: `${base}__check_env.py`, content: bundle.files.checkEnvPy, mimeType: "text/x-python" },
    { fileName: `${base}__config.yaml`, content: bundle.files.configYaml, mimeType: "text/yaml" },
    { fileName: `${base}__requirements.txt`, content: bundle.files.requirementsTxt, mimeType: "text/plain" },
    { fileName: `${base}__README_local_training.md`, content: bundle.files.readmeMd, mimeType: "text/markdown" },
    { fileName: `${base}__README_ollama_export.md`, content: bundle.files.ollamaReadmeMd, mimeType: "text/markdown" },
    { fileName: `${base}__runbook.md`, content: bundle.files.runbookMd, mimeType: "text/markdown" },
  ];
}
