// AetherSeed Experiment Ledger · 类型定义 v0.1
// 安全边界：不自动执行训练；checkpointPath 仅作为用户手动文本记录；
// 训练日志只保存用户主动粘贴摘要；不上传数据；不下载模型。

export type ExperimentType =
  | "LOCAL_TRAINING"
  | "SERVER_TRAINING"
  | "EVAL_ONLY"
  | "TOKENIZER_TEST"
  | "ROUTER_TINY"
  | "MSL_TINY"
  | "FORMAT_TINY"
  | "SFT"
  | "PRETRAIN"
  | "LORA"
  | "QLORA";

export const EXPERIMENT_TYPE_LABEL: Record<ExperimentType, string> = {
  LOCAL_TRAINING: "本机训练",
  SERVER_TRAINING: "服务器训练",
  EVAL_ONLY: "仅评测",
  TOKENIZER_TEST: "Tokenizer 验证",
  ROUTER_TINY: "Router Tiny",
  MSL_TINY: "MSL Tiny",
  FORMAT_TINY: "Format Tiny",
  SFT: "SFT 微调",
  PRETRAIN: "预训练",
  LORA: "LoRA",
  QLORA: "QLoRA",
};

export type ExperimentTargetModel =
  | "AETHERSEED_10M"
  | "AETHERSEED_50M"
  | "AETHERSEED_100M"
  | "AETHERSEED_300M"
  | "AETHERSEED_700M"
  | "AETHERSEED_1_5B"
  | "AETHERSEED_3B"
  | "AETHERSEED_7B"
  | "ROUTER_TINY"
  | "MSL_TINY"
  | "FORMAT_TINY";

export const EXPERIMENT_TARGET_LABEL: Record<ExperimentTargetModel, string> = {
  AETHERSEED_10M: "AetherSeed-10M",
  AETHERSEED_50M: "AetherSeed-50M",
  AETHERSEED_100M: "AetherSeed-100M",
  AETHERSEED_300M: "AetherSeed-300M",
  AETHERSEED_700M: "AetherSeed-700M",
  AETHERSEED_1_5B: "AetherSeed-1.5B",
  AETHERSEED_3B: "AetherSeed-3B",
  AETHERSEED_7B: "AetherSeed-7B",
  ROUTER_TINY: "Router Tiny",
  MSL_TINY: "MSL Tiny",
  FORMAT_TINY: "Format Tiny",
};

export const BLOODLINE_ORDER: ExperimentTargetModel[] = [
  "AETHERSEED_10M",
  "AETHERSEED_50M",
  "AETHERSEED_100M",
  "AETHERSEED_300M",
  "AETHERSEED_700M",
  "AETHERSEED_1_5B",
  "AETHERSEED_3B",
  "AETHERSEED_7B",
];

export type ExperimentStatus =
  | "DRAFT"
  | "READY_TO_RUN"
  | "RUNNING_MANUAL"
  | "COMPLETED_MANUAL"
  | "FAILED_MANUAL"
  | "EVALUATED"
  | "ARCHIVED";

export const EXPERIMENT_STATUS_LABEL: Record<ExperimentStatus, string> = {
  DRAFT: "草稿",
  READY_TO_RUN: "待执行",
  RUNNING_MANUAL: "训练中（手动）",
  COMPLETED_MANUAL: "已完成（手动）",
  FAILED_MANUAL: "已失败（手动）",
  EVALUATED: "已评测",
  ARCHIVED: "已归档",
};

export type ExperimentLocation = "LOCAL_PC" | "GPU_SERVER" | "UNKNOWN";

export const EXPERIMENT_LOCATION_LABEL: Record<ExperimentLocation, string> = {
  LOCAL_PC: "本机",
  GPU_SERVER: "GPU 服务器",
  UNKNOWN: "未指定",
};

export interface AetherSeedExperiment {
  id: string;
  name: string;
  experimentType: ExperimentType;
  targetModel: ExperimentTargetModel;
  datasetVersionId?: string;
  evalDatasetVersionId?: string;
  localTrainingPlanId?: string;
  status: ExperimentStatus;
  location: ExperimentLocation;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface ExperimentMetrics {
  id: string;
  experimentId: string;
  trainLoss?: number;
  evalLoss?: number;
  perplexity?: number;
  mslValidity?: number;
  jsonValidity?: number;
  routerAccuracy?: number;
  toolCallValidity?: number;
  lovablePromptScore?: number;
  safetyPassRate?: number;
  notes: string;
  createdAt: string;
}

export type CheckpointFormat =
  | "PYTORCH"
  | "SAFETENSORS"
  | "GGUF"
  | "OLLAMA"
  | "UNKNOWN";

export type CheckpointStatus =
  | "REGISTERED_MANUAL"
  | "VALIDATED"
  | "EVAL_PENDING"
  | "IMPORT_PENDING"
  | "ARCHIVED";

export const CHECKPOINT_STATUS_LABEL: Record<CheckpointStatus, string> = {
  REGISTERED_MANUAL: "已登记（手动）",
  VALIDATED: "已校验",
  EVAL_PENDING: "等待评测",
  IMPORT_PENDING: "等待导入 Provider",
  ARCHIVED: "已归档",
};

export interface CheckpointRecord {
  id: string;
  experimentId: string;
  checkpointName: string;
  checkpointPath?: string;
  modelFormat: CheckpointFormat;
  sizeMb?: number;
  status: CheckpointStatus;
  notes: string;
  createdAt: string;
}

export type FailureType =
  | "DATA_ERROR"
  | "CONFIG_ERROR"
  | "OOM"
  | "SLOW_TRAINING"
  | "LOSS_NAN"
  | "BAD_OUTPUT"
  | "EVAL_FAILED"
  | "UNKNOWN";

export const FAILURE_TYPE_LABEL: Record<FailureType, string> = {
  DATA_ERROR: "数据错误",
  CONFIG_ERROR: "配置错误",
  OOM: "显存 / 内存溢出",
  SLOW_TRAINING: "训练过慢",
  LOSS_NAN: "Loss NaN",
  BAD_OUTPUT: "输出质量差",
  EVAL_FAILED: "评测失败",
  UNKNOWN: "未知原因",
};

export interface ExperimentFailureReport {
  id: string;
  experimentId: string;
  failureType: FailureType;
  summary: string;
  suspectedCauses: string[];
  suggestedFixes: string[];
  shouldRetry: boolean;
  createdAt: string;
}

export type NextRecommendationType =
  | "RETRY"
  | "SMALLER_MODEL"
  | "MORE_DATA"
  | "CLEAN_DATA"
  | "CHANGE_LR"
  | "SHORTER_CONTEXT"
  | "DIFFERENT_FORMAT"
  | "RUN_EVAL"
  | "IMPORT_MODEL"
  | "SCALE_UP";

export const NEXT_RECOMMENDATION_LABEL: Record<NextRecommendationType, string> = {
  RETRY: "重试",
  SMALLER_MODEL: "换更小模型",
  MORE_DATA: "增加数据",
  CLEAN_DATA: "清洗数据",
  CHANGE_LR: "调整学习率",
  SHORTER_CONTEXT: "缩短上下文",
  DIFFERENT_FORMAT: "更换输出格式",
  RUN_EVAL: "补充评测",
  IMPORT_MODEL: "导入产物",
  SCALE_UP: "放大规模",
};

export interface NextExperimentPlan {
  id: string;
  basedOnExperimentId: string;
  recommendationType: NextRecommendationType;
  title: string;
  rationale: string;
  suggestedChanges: string[];
  priority: "P0" | "P1" | "P2" | "P3";
  createdAt: string;
}

export interface ModelBloodlineRecord {
  id: string;
  modelName: string;
  generation: string;
  parentExperimentIds: string[];
  datasetVersionIds: string[];
  checkpointIds: string[];
  capabilitySummary: string[];
  knownWeaknesses: string[];
  nextTargets: string[];
  createdAt: string;
  updatedAt: string;
}

let SEQ = 0;
export function nextExperimentId(prefix: string): string {
  SEQ += 1;
  return `${prefix}-${Date.now().toString(36)}-${SEQ.toString(36)}`;
}
