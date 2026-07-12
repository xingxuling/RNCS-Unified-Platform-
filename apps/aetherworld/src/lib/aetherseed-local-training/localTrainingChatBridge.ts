// AetherSeed Local Training · Chat 桥
// 识别本机训练 / AetherSeed-10M/50M/100M / Router/MSL/Format Tiny / 训练包 / 训练步骤等意图。
import { listDatasetVersions } from "@/lib/aetherseed-dataset/datasetBuilder";
import {
  LOCAL_TRAINING_MODE_LABEL,
  LOCAL_TRAINING_TARGET_LABEL,
  type LocalTrainingMode,
  type LocalTrainingTarget,
} from "./localTrainingTypes";
import {
  LOCAL_TRAINING_SAFETY_ALLOWED,
  LOCAL_TRAINING_SAFETY_FORBIDDEN,
} from "./localTrainingSafetyPolicy";
import {
  buildLocalTrainingPackageFiles,
  listLocalTrainingBundles,
  planLocalTraining,
} from "./localTrainingRuntime";
import { pickDefaultMode } from "./localTrainingPlanBuilder";
import { PRESET_300M_LIST, type Preset300mId } from "./localTrainingExtendedOptions";

export type LocalTrainingChatFocus =
  | "OVERVIEW"
  | "PLAN_300M"
  | "PLAN_300M_SMOKE"
  | "PLAN_300M_NIGHTLY"
  | "PLAN_300M_FIRST_RUN"
  | "PLAN_300M_FORMAT"
  | "PLAN_10M"
  | "PLAN_50M"
  | "PLAN_100M"
  | "PLAN_ROUTER"
  | "PLAN_MSL"
  | "PLAN_FORMAT"
  | "STEPS"
  | "EXPERIMENT_LOG"
  | "TONIGHT"
  | "OLLAMA_EXPORT";

const FOCUS_LABEL: Record<LocalTrainingChatFocus, string> = {
  OVERVIEW: "本机训练总览",
  PLAN_300M: "AetherSeed 300M 私有模型训练计划",
  PLAN_300M_SMOKE: "300M 冒烟测试配置",
  PLAN_300M_NIGHTLY: "300M 夜间慢训配置",
  PLAN_300M_FIRST_RUN: "300M 正式第一炉配置",
  PLAN_300M_FORMAT: "300M 格式强化配置",
  PLAN_10M: "AetherSeed-10M 训练计划",
  PLAN_50M: "AetherSeed-50M 训练计划",
  PLAN_100M: "AetherSeed-100M 训练计划",
  PLAN_ROUTER: "Router Tiny 训练计划",
  PLAN_MSL: "MSL Tiny 训练计划",
  PLAN_FORMAT: "Format Tiny 训练计划",
  STEPS: "本机训练步骤",
  EXPERIMENT_LOG: "训练完成后登记",
  TONIGHT: "今晚本机训练计划",
  OLLAMA_EXPORT: "Ollama 接入准备",
};

const TRIGGER_KEYWORDS = [
  "本机训练", "本地训练", "local training", "训练运行器", "训练配置台",
  "aetherseed-300m", "aetherseed 300m", "300m 模型", "300m 私有", "私有模型",
  "aetherseed-10m", "aetherseed 10m", "10m 模型",
  "aetherseed-50m", "aetherseed 50m", "50m 模型",
  "aetherseed-100m", "aetherseed 100m", "100m 模型",
  "router tiny", "msl tiny", "format tiny",
  "本机训练包", "训练脚本", "train.py", "config.yaml", "check_env",
  "训练步骤", "训练完", "checkpoint 怎么登记", "怎么登记",
  "今晚训练", "夜间训练", "慢速训练", "冒烟", "正式第一炉",
  "ollama", "ollama 接入", "modelfile", "gguf",
];

export function detectLocalTrainingIntent(raw: string): boolean {
  if (!raw) return false;
  const t = raw.toLowerCase();
  return TRIGGER_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

function pickFocus(raw: string): LocalTrainingChatFocus {
  const t = raw.toLowerCase();
  if (/ollama|modelfile|gguf|接入|接回/.test(t)) return "OLLAMA_EXPORT";
  if (/今晚|夜间|tonight/.test(t) && /300m|私有/.test(t)) return "PLAN_300M_NIGHTLY";
  if (/今晚|夜间|tonight/.test(t)) return "TONIGHT";
  if (/怎么登记|checkpoint.*登记|训练完.*登记|实验记录/.test(t)) return "EXPERIMENT_LOG";
  if (/步骤|哪些步|步骤是|流程/.test(t)) return "STEPS";
  if (/300m.*冒烟|冒烟.*300m|smoke/.test(t)) return "PLAN_300M_SMOKE";
  if (/300m.*夜间|夜间.*300m|300m.*慢训/.test(t)) return "PLAN_300M_NIGHTLY";
  if (/300m.*第一炉|第一炉.*300m|正式第一炉/.test(t)) return "PLAN_300M_FIRST_RUN";
  if (/300m.*格式|格式强化|format.*300m/.test(t)) return "PLAN_300M_FORMAT";
  if (/300m|私有模型/.test(t)) return "PLAN_300M";
  if (/format tiny|格式.*模型|format.*模型/.test(t)) return "PLAN_FORMAT";
  if (/msl tiny|msl.*模型/.test(t)) return "PLAN_MSL";
  if (/router tiny|router.*模型|路由.*模型/.test(t)) return "PLAN_ROUTER";
  if (/100m/.test(t)) return "PLAN_100M";
  if (/50m/.test(t)) return "PLAN_50M";
  if (/10m/.test(t)) return "PLAN_10M";
  return "OVERVIEW";
}

const TARGET_BY_FOCUS: Partial<Record<LocalTrainingChatFocus, LocalTrainingTarget>> = {
  PLAN_300M: "AETHERSEED_300M_PRIVATE",
  PLAN_300M_SMOKE: "AETHERSEED_300M_PRIVATE",
  PLAN_300M_NIGHTLY: "AETHERSEED_300M_PRIVATE",
  PLAN_300M_FIRST_RUN: "AETHERSEED_300M_PRIVATE",
  PLAN_300M_FORMAT: "AETHERSEED_300M_PRIVATE",
  PLAN_10M: "AETHERSEED_10M",
  PLAN_50M: "AETHERSEED_50M",
  PLAN_100M: "AETHERSEED_100M",
  PLAN_ROUTER: "ROUTER_TINY",
  PLAN_MSL: "MSL_TINY",
  PLAN_FORMAT: "FORMAT_TINY",
  TONIGHT: "AETHERSEED_300M_PRIVATE",
  OLLAMA_EXPORT: "AETHERSEED_300M_PRIVATE",
};

export interface ChatLocalTrainingInfo {
  question: string;
  focus: LocalTrainingChatFocus;
  focusLabel: string;
  summary: string;
  /** 当前可选数据集（最多 6 条） */
  availableDatasets: {
    id: string;
    name: string;
    version: string;
    safetyStatus: string;
    sampleCount: number;
  }[];
  /** 命中目标 + 默认模式 + 草案预览 */
  draftPlan?: {
    targetModel: LocalTrainingTarget;
    targetLabel: string;
    trainingMode: LocalTrainingMode;
    trainingModeLabel: string;
    datasetVersionId: string;
    estimatedDuration: string;
    expectedOutput: string[];
    packageFileNames: string[];
  };
  /** 全部目标模型清单（便于卡片展示） */
  allTargets: { target: LocalTrainingTarget; label: string }[];
  safetyAllowed: string[];
  safetyForbidden: string[];
  workbenchHint: string;
  recentBundles: { planId: string; name: string; target: LocalTrainingTarget; createdAt: string }[];
}

const FOCUS_TO_PRESET_ID: Partial<Record<LocalTrainingChatFocus, Preset300mId>> = {
  PLAN_300M_SMOKE: "PRESET_300M_SMOKE",
  PLAN_300M_NIGHTLY: "PRESET_300M_NIGHTLY",
  PLAN_300M_FIRST_RUN: "PRESET_300M_FIRST_RUN",
  PLAN_300M_FORMAT: "PRESET_300M_FORMAT",
};

export function buildChatLocalTrainingInfo(raw: string): ChatLocalTrainingInfo | undefined {
  if (!detectLocalTrainingIntent(raw)) return undefined;
  const focus = pickFocus(raw);
  const datasets = listDatasetVersions().filter((d) => d.safetyStatus !== "BLOCK");
  const targetForPlan = TARGET_BY_FOCUS[focus];
  let draftPlan: ChatLocalTrainingInfo["draftPlan"];
  if (targetForPlan && datasets.length > 0) {
    const dataset = datasets[0];
    const presetId = FOCUS_TO_PRESET_ID[focus];
    const preset = presetId ? PRESET_300M_LIST.find((p) => p.id === presetId) : undefined;
    const bundle = planLocalTraining({
      target: targetForPlan,
      dataset,
      mode: preset?.mode,
      extendedOptions: preset?.options,
      presetName: preset?.name,
    });
    draftPlan = {
      targetModel: bundle.plan.targetModel,
      targetLabel: LOCAL_TRAINING_TARGET_LABEL[bundle.plan.targetModel],
      trainingMode: bundle.plan.trainingMode,
      trainingModeLabel: LOCAL_TRAINING_MODE_LABEL[bundle.plan.trainingMode],
      datasetVersionId: bundle.plan.datasetVersionId,
      estimatedDuration: bundle.plan.estimatedDuration,
      expectedOutput: bundle.plan.expectedOutput,
      packageFileNames: buildLocalTrainingPackageFiles(bundle).map((f) => f.fileName),
    };
  }

  return {
    question: raw,
    focus,
    focusLabel: FOCUS_LABEL[focus],
    summary: buildSummary(focus, datasets.length),
    availableDatasets: datasets.slice(0, 6).map((d) => ({
      id: d.id,
      name: d.name,
      version: d.version,
      safetyStatus: d.safetyStatus,
      sampleCount: d.sampleCount,
    })),
    draftPlan,
    allTargets: (Object.keys(LOCAL_TRAINING_TARGET_LABEL) as LocalTrainingTarget[]).map((t) => ({
      target: t,
      label: LOCAL_TRAINING_TARGET_LABEL[t],
    })),
    safetyAllowed: LOCAL_TRAINING_SAFETY_ALLOWED,
    safetyForbidden: LOCAL_TRAINING_SAFETY_FORBIDDEN,
    workbenchHint: "前往 /system/local-training 完成训练包生成、下载与实验登记（不自动执行）。",
    recentBundles: listLocalTrainingBundles().slice(0, 5).map((b) => ({
      planId: b.plan.id,
      name: b.plan.name,
      target: b.plan.targetModel,
      createdAt: b.plan.createdAt,
    })),
  };
}

function buildSummary(focus: LocalTrainingChatFocus, datasetCount: number): string {
  if (datasetCount === 0) {
    return "尚未发现可用的数据集版本。请先在 /system/intake-forge 投喂材料，并在 /system/datasets 构建版本，再回到本机训练运行器。";
  }
  switch (focus) {
    case "PLAN_10M":
      return "AetherSeed-10M：脚本验证级 toy 模型，CPU 1-3 小时可跑通；用于打通数据管线与训练脚本。";
    case "PLAN_50M":
      return "AetherSeed-50M：验证 Aetherworld 术语 / MSL / Lovable Prompt 风格；建议有独显，纯 CPU 可夜间训练。";
    case "PLAN_100M":
      return "AetherSeed-100M：小型结构输出能力；建议在独显或服务器上运行。";
    case "PLAN_ROUTER":
      return "Router Tiny Model：把用户输入路由到计算法链 / Agent / 工具；适合本机快速训练（30 分钟 - 2 小时）。";
    case "PLAN_MSL":
      return "MSL Tiny Model：事件 → MSL 状态帧；用 EVAL 数据集复测命中率。";
    case "PLAN_FORMAT":
      return "Format Tiny Model：稳定 JSON / ChatML / Tool Call 输出格式。";
    case "STEPS":
      return "本机训练步骤：下载完整训练包 → 创建虚拟环境 → 安装依赖 → 手动执行 train.py → 手动执行 eval.py → 回到本页登记 COMPLETED_MANUAL。";
    case "EXPERIMENT_LOG":
      return "训练完 checkpoint 后，到 /system/local-training 找到对应实验，把状态从 READY_TO_RUN 改为 COMPLETED_MANUAL，并填写 outputArtifactPath / evalSummary。";
    case "TONIGHT":
      return "今晚本机训练建议：先跑 AetherSeed 300M「冒烟测试」预设打通链路；通过后再切换到「夜间慢训」长跑。";
    case "PLAN_300M":
      return "AetherSeed 300M 私有模型：Aetherworld 的第一个私有本地脑，仅供创始人本人和内部使用，不开源、不公开。推荐第一炉先跑冒烟测试。";
    case "PLAN_300M_SMOKE":
      return "300M 冒烟测试：小样本 + 100 step + 高频 checkpoint，仅用于验证链路。";
    case "PLAN_300M_NIGHTLY":
      return "300M 夜间慢训：保守 batch + 12 小时窗口 + 每 20 分钟 checkpoint，适合长时间低干预运行。";
    case "PLAN_300M_FIRST_RUN":
      return "300M 正式第一炉：使用当前 v0.1 数据集 + 24 小时窗口 + 评测开启，并自动创建实验账本记录。";
    case "PLAN_300M_FORMAT":
      return "300M 格式强化：使用 SFT_JSONL / ALPACA / LOVABLE_PROMPT_JSON 强化结构化输出稳定性。";
    case "OLLAMA_EXPORT":
      return "Ollama 接入准备：训练完成 → 转 HuggingFace → 转 GGUF → 写 Modelfile → ollama create aetherseed-300m。完整步骤在 README_ollama_export.md。";
    case "OVERVIEW":
    default:
      return "AetherSeed 本机训练配置台：默认主线是 300M 私有模型；只生成训练计划 / 配置 / 脚本 / Runbook / 实验记录，不自动训练，不上传，不下载。";
  }
}
