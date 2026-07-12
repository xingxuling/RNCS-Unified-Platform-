// AetherSeed Training Workflow Orchestrator · 类型 v0.1
// 安全边界：不自动执行 shell；不跳过 dry-run；不跳过用户确认；不上传数据；不下载模型。
// 高风险步骤必须停留在 WAITING_CONFIRMATION 或 MANUAL_EXTERNAL_ACTION。

export type WorkflowStepId =
  | "RAW_MATERIAL"
  | "INTAKE_RUN"
  | "DATASET_VERSION"
  | "EXPORT_PACKAGE"
  | "LOCAL_TRAINING_PLAN"
  | "AUTO_TRAINING_DRYRUN"
  | "USER_CONFIRMATION"
  | "TRAINING_EXECUTION"
  | "EXPERIMENT_RECORD"
  | "METRICS_CHECKPOINT"
  | "NEXT_EXPERIMENT_PLAN"
  | "MODEL_BLOODLINE";

export const WORKFLOW_STEP_LABEL: Record<WorkflowStepId, string> = {
  RAW_MATERIAL: "原料登记",
  INTAKE_RUN: "投喂铸造",
  DATASET_VERSION: "数据集版本",
  EXPORT_PACKAGE: "导出训练包",
  LOCAL_TRAINING_PLAN: "本机训练计划",
  AUTO_TRAINING_DRYRUN: "自动训练 Dry-run",
  USER_CONFIRMATION: "用户确认",
  TRAINING_EXECUTION: "训练执行",
  EXPERIMENT_RECORD: "实验登记",
  METRICS_CHECKPOINT: "指标 / Checkpoint",
  NEXT_EXPERIMENT_PLAN: "下一炉建议",
  MODEL_BLOODLINE: "模型血统",
};

export type WorkflowStepStatus =
  | "PENDING"
  | "READY"
  | "RUNNING"
  | "WAITING_CONFIRMATION"
  | "MANUAL_EXTERNAL_ACTION"
  | "DONE"
  | "FAILED"
  | "SKIPPED"
  | "BLOCKED";

export const WORKFLOW_STATUS_LABEL: Record<WorkflowStepStatus, string> = {
  PENDING: "等待上游",
  READY: "可执行",
  RUNNING: "进行中",
  WAITING_CONFIRMATION: "等待用户确认",
  MANUAL_EXTERNAL_ACTION: "等待手动训练",
  DONE: "完成",
  FAILED: "失败",
  SKIPPED: "跳过",
  BLOCKED: "已阻断",
};

export type WorkflowGateLevel = "L0_AUTO" | "L1_NOTICE" | "L2_CONFIRM" | "L3_MANUAL_ONLY";

export const WORKFLOW_GATE_LABEL: Record<WorkflowGateLevel, string> = {
  L0_AUTO: "自动通过",
  L1_NOTICE: "提示通过",
  L2_CONFIRM: "需用户确认",
  L3_MANUAL_ONLY: "仅可手动",
};

export interface WorkflowArtifactRef {
  kind:
    | "INTAKE_RUN_ID"
    | "DATASET_VERSION_ID"
    | "EXPORT_PACKAGE_ID"
    | "LOCAL_TRAINING_PLAN_ID"
    | "AUTO_TRAINING_RUN_ID"
    | "EXPERIMENT_ID"
    | "CHECKPOINT_ID"
    | "NEXT_PLAN_ID"
    | "BLOODLINE_NODE_ID"
    | "NOTE";
  id: string;
  label: string;
}

export interface WorkflowStep {
  id: WorkflowStepId;
  label: string;
  status: WorkflowStepStatus;
  gateLevel: WorkflowGateLevel;
  blockedReason?: string;
  artifacts: WorkflowArtifactRef[];
  note?: string;
  updatedAt: number;
}

export type WorkflowOverallStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "WAITING_USER"
  | "WAITING_MANUAL_TRAINING"
  | "COMPLETED"
  | "FAILED"
  | "ARCHIVED";

export const WORKFLOW_OVERALL_LABEL: Record<WorkflowOverallStatus, string> = {
  DRAFT: "草稿",
  IN_PROGRESS: "进行中",
  WAITING_USER: "等待用户确认",
  WAITING_MANUAL_TRAINING: "等待手动训练",
  COMPLETED: "已完成",
  FAILED: "已失败",
  ARCHIVED: "已归档",
};

export interface TrainingWorkflow {
  id: string;
  title: string;
  targetModel: string;
  intent: string; // 用户原始意图（中文）
  steps: WorkflowStep[];
  currentStepId: WorkflowStepId;
  overallStatus: WorkflowOverallStatus;
  createdAt: number;
  updatedAt: number;
  retryOfExperimentId?: string;
  notes: string[];
}

export interface WorkflowNextAction {
  stepId: WorkflowStepId;
  label: string;
  hint: string;
  blocking: boolean;
}
