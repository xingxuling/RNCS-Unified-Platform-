// AetherSeed Local Training Runner · 类型定义 v0.1
// 不自动训练；不执行 shell；只生成本机训练计划 / 配置 / 脚本草案 / 实验记录。

export type LocalTrainingTarget =
  | "AETHERSEED_10M"
  | "AETHERSEED_50M"
  | "AETHERSEED_100M"
  | "AETHERSEED_300M_PRIVATE"
  | "ROUTER_TINY"
  | "MSL_TINY"
  | "FORMAT_TINY";

export const LOCAL_TRAINING_TARGET_LABEL: Record<LocalTrainingTarget, string> = {
  AETHERSEED_10M: "AetherSeed-10M（脚本验证）",
  AETHERSEED_50M: "AetherSeed-50M（术语 / MSL / Lovable Prompt）",
  AETHERSEED_100M: "AetherSeed-100M（小型结构输出）",
  AETHERSEED_300M_PRIVATE: "AetherSeed 300M 私有模型（创始人私有 · 主线）",
  ROUTER_TINY: "Router Tiny Model（路由模型）",
  MSL_TINY: "MSL Tiny Model（事件→状态帧）",
  FORMAT_TINY: "Format Tiny Model（格式稳定器）",
};

export type LocalTrainingMode =
  | "FROM_SCRATCH_TOY"
  | "SFT_TINY"
  | "SFT_ONLY"
  | "CONTINUED_PRETRAIN_PLUS_SFT"
  | "FORMAT_TUNING"
  | "ROUTER_TRAINING"
  | "MSL_TRAINING";

export const LOCAL_TRAINING_MODE_LABEL: Record<LocalTrainingMode, string> = {
  FROM_SCRATCH_TOY: "从零小模型（toy）",
  SFT_TINY: "SFT 小模型微调",
  SFT_ONLY: "仅指令微调（SFT_ONLY）",
  CONTINUED_PRETRAIN_PLUS_SFT: "继续训练 + 指令微调（CPT + SFT）",
  FORMAT_TUNING: "格式稳定调优",
  ROUTER_TRAINING: "Router 训练",
  MSL_TRAINING: "MSL 训练",
};

export type LocalTrainingSafetyStatus = "PASS" | "WARN" | "BLOCK";

export interface LocalTrainingPlan {
  id: string;
  name: string;
  targetModel: LocalTrainingTarget;
  datasetVersionId: string;
  evalDatasetVersionId?: string;
  trainingMode: LocalTrainingMode;
  location: "LOCAL_PC";
  estimatedDuration: string;
  expectedOutput: string[];
  safetyStatus: LocalTrainingSafetyStatus;
  createdAt: string;
}

export interface LocalTrainingConfig {
  id: string;
  planId: string;
  modelConfig: {
    vocabSize?: number;
    hiddenSize: number;
    numLayers: number;
    numHeads: number;
    contextLength: number;
    parameterEstimate: string;
  };
  trainingConfig: {
    epochs: number;
    batchSize: number;
    learningRate: string;
    precision: string;
    saveEverySteps: number;
    evalEverySteps: number;
  };
  datasetConfig: {
    trainFile: string;
    evalFile?: string;
    format: string;
  };
}

export interface LocalTrainingRunbook {
  id: string;
  planId: string;
  steps: string[];
  commands: string[];
  expectedArtifacts: string[];
  troubleshooting: string[];
  safetyNotes: string[];
}

export type LocalTrainingExperimentStatus =
  | "DRAFT"
  | "READY_TO_RUN"
  | "RUNNING_MANUAL"
  | "COMPLETED_MANUAL"
  | "FAILED_MANUAL"
  | "EVALUATED";

export interface LocalTrainingExperiment {
  id: string;
  planId: string;
  status: LocalTrainingExperimentStatus;
  datasetVersionId: string;
  outputArtifactPath?: string;
  userNotes?: string;
  evalSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalTrainingEvalPlan {
  id: string;
  planId: string;
  evalFile?: string;
  metrics: string[];
  notes: string[];
}

let __lid = 0;
export function nextLocalTrainingId(prefix: "LTP" | "LTC" | "LTR" | "LTE" | "LTV"): string {
  __lid += 1;
  return `${prefix}-${Date.now().toString(36)}-${__lid.toString(36)}`;
}
