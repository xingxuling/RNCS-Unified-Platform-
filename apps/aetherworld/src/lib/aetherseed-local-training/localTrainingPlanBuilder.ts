// AetherSeed Local Training · 计划构建器
import type { DatasetVersion } from "@/lib/aetherseed-dataset/datasetTypes";
import {
  LOCAL_TRAINING_MODE_LABEL,
  LOCAL_TRAINING_TARGET_LABEL,
  type LocalTrainingMode,
  type LocalTrainingPlan,
  type LocalTrainingTarget,
  nextLocalTrainingId,
} from "./localTrainingTypes";

const DURATION_HINT: Record<LocalTrainingTarget, string> = {
  AETHERSEED_10M: "本机 CPU 1-3 小时（toy 验证）",
  AETHERSEED_50M: "本机 CPU 6-24 小时；有独显约 1-3 小时",
  AETHERSEED_100M: "本机有独显约 6-24 小时；纯 CPU 不建议",
  AETHERSEED_300M_PRIVATE: "本机长时训练：纯 CPU 数天-数周；独显约 1-5 天；需高频 checkpoint",
  ROUTER_TINY: "本机 30 分钟 - 2 小时",
  MSL_TINY: "本机 1-4 小时",
  FORMAT_TINY: "本机 30 分钟 - 2 小时",
};

const DEFAULT_MODE: Record<LocalTrainingTarget, LocalTrainingMode> = {
  AETHERSEED_10M: "FROM_SCRATCH_TOY",
  AETHERSEED_50M: "SFT_TINY",
  AETHERSEED_100M: "SFT_TINY",
  AETHERSEED_300M_PRIVATE: "CONTINUED_PRETRAIN_PLUS_SFT",
  ROUTER_TINY: "ROUTER_TRAINING",
  MSL_TINY: "MSL_TRAINING",
  FORMAT_TINY: "FORMAT_TUNING",
};

const EXPECTED_OUTPUT: Record<LocalTrainingTarget, string[]> = {
  AETHERSEED_10M: ["checkpoint/aetherseed_10m_step_*.pt", "训练日志 train.log", "eval_loss.json"],
  AETHERSEED_50M: ["checkpoint/aetherseed_50m_step_*.pt", "tokenizer/", "train.log", "eval_loss.json"],
  AETHERSEED_100M: ["checkpoint/aetherseed_100m_step_*.pt", "tokenizer/", "train.log", "eval_report.json"],
  AETHERSEED_300M_PRIVATE: [
    "outputs/checkpoints/aetherseed_300m_private_step_*.pt",
    "outputs/checkpoints/aetherseed_300m_private_final/",
    "tokenizer/",
    "logs/train.log",
    "logs/eval.log",
    "eval_report.json",
    "README_ollama_export.md",
  ],
  ROUTER_TINY: ["checkpoint/router_tiny.pt", "router_eval.json"],
  MSL_TINY: ["checkpoint/msl_tiny.pt", "msl_eval.json"],
  FORMAT_TINY: ["checkpoint/format_tiny.pt", "format_eval.json"],
};

export function pickDefaultMode(target: LocalTrainingTarget): LocalTrainingMode {
  return DEFAULT_MODE[target];
}

export function buildLocalTrainingPlan(input: {
  name?: string;
  target: LocalTrainingTarget;
  dataset: DatasetVersion;
  evalDataset?: DatasetVersion;
  mode?: LocalTrainingMode;
}): LocalTrainingPlan {
  const target = input.target;
  const mode = input.mode ?? DEFAULT_MODE[target];
  const safety: LocalTrainingPlan["safetyStatus"] = input.dataset.safetyStatus === "BLOCK" ? "BLOCK" : input.dataset.safetyStatus;
  const name =
    input.name?.trim() ||
    `本机训练 · ${LOCAL_TRAINING_TARGET_LABEL[target]} · ${input.dataset.name} ${input.dataset.version}`;
  return {
    id: nextLocalTrainingId("LTP"),
    name,
    targetModel: target,
    datasetVersionId: input.dataset.id,
    evalDatasetVersionId: input.evalDataset?.id,
    trainingMode: mode,
    location: "LOCAL_PC",
    estimatedDuration: DURATION_HINT[target],
    expectedOutput: EXPECTED_OUTPUT[target],
    safetyStatus: safety,
    createdAt: new Date().toISOString(),
  };
}

export function describePlan(plan: LocalTrainingPlan): string {
  return `${plan.name} · 模式 ${LOCAL_TRAINING_MODE_LABEL[plan.trainingMode]} · 预计 ${plan.estimatedDuration}`;
}
