// AetherSeed 300M One-Click Training Pipeline · 类型定义 v0.1
// 受控自动流水线：可自动 检查 / 生成 / 接线 / 预检查 / 记录；
// 真正执行训练命令前必须用户确认；用户确认仅本会话内存有效。

export type PipelineStage =
  | "NOT_READY"        // 未准备
  | "PREPARING"        // 准备中（自动补齐进行中或缺关键材料）
  | "READY_FOR_DRYRUN" // 可执行 dry-run
  | "WAITING_CONFIRM"  // dry-run 通过、网关已连接、等待用户确认
  | "RUNNING"          // 已调用本地网关 /training/run
  | "COMPLETED"        // 已完成
  | "FAILED";          // 失败

export const PIPELINE_STAGE_LABEL: Record<PipelineStage, string> = {
  NOT_READY:        "未准备",
  PREPARING:        "准备中",
  READY_FOR_DRYRUN: "可执行 Dry-run",
  WAITING_CONFIRM:  "等待用户确认",
  RUNNING:          "训练中",
  COMPLETED:        "已完成",
  FAILED:           "失败",
};

export type PipelineCheckId =
  | "RAW_MATERIAL"
  | "TRAINING_DATASET"
  | "EVAL_DATASET"
  | "SAFETY_REPORT"
  | "LICENSE"
  | "REAL_EXPORT"
  | "TRAINING_PLAN"
  | "EXPERIMENT_RECORD"
  | "TRAINING_WORKFLOW"
  | "AUTO_TRAINING_TASK"
  | "DRY_RUN"
  | "GATEWAY_CONNECTED"
  | "GATEWAY_HEALTH"
  | "COMMAND_WHITELIST"
  | "OUTPUT_DIR_WHITELIST"
  | "USER_CONFIRMED";

export type PipelineCheckStatus = "PASS" | "WARN" | "FAIL" | "PENDING";

export const PIPELINE_CHECK_STATUS_LABEL: Record<PipelineCheckStatus, string> = {
  PASS:    "已通过",
  WARN:    "警告",
  FAIL:    "未通过",
  PENDING: "未生成",
};

export interface PipelineCheckItem {
  id: PipelineCheckId;
  label: string;
  status: PipelineCheckStatus;
  detail: string;
  /** 是否阻断点火 */
  required: boolean;
  /** 是否可由「自动补齐」处理 */
  autoFillable: boolean;
  /** 跳转修复路径 */
  remediationRoute?: string;
  /** 已尝试自动补齐 */
  autoFilled?: boolean;
}

export interface PipelinePreviewCommand {
  label: string;
  executable: string;
  args: string[];
  workingDirectory: string;
  whitelist: "PASS" | "WARN" | "FAIL";
}

export interface PipelinePreview {
  commands: PipelinePreviewCommand[];
  inputs: string[];
  outputDir: string;
  logDir: string;
  checkpointDir: string;
  risks: string[];
  whitelistPassed: boolean;
  needsUserConfirmation: boolean;
}

export interface PipelineGatewayState {
  connected: boolean;
  healthOk: boolean;
  reason?: string;
  baseUrl?: string;
}

export interface PipelineLatestExperimentInfo {
  id: string;
  name: string;
  status: string;
  runId?: string;
  startedAt?: string;
  endedAt?: string;
  lastError?: string;
}

export interface PipelineAutoFillResult {
  createdDatasetId?: string;
  createdPlanId?: string;
  createdExperimentId?: string;
  createdWorkflowId?: string;
  createdAutoTrainingTaskId?: string;
  performedDryRun: boolean;
  dryRunPassed?: boolean;
  blockedReasons: string[];
  notes: string[];
}

export interface PipelineNextStepHint {
  label: string;
  detail: string;
  route?: string;
}

export interface PipelineSnapshot {
  stage: PipelineStage;
  stageLabel: string;
  score: number; // 0-100
  canIgnite: boolean;
  userConfirmed: boolean;
  checks: PipelineCheckItem[];
  blockingReasons: string[];
  gateway: PipelineGatewayState;
  preview?: PipelinePreview;
  latestExperiment?: PipelineLatestExperimentInfo;
  /** 当前阶段下的建议下一步操作（不替用户执行） */
  nextSteps: PipelineNextStepHint[];
  /** 训练完成 / 失败 后的下一炉建议 */
  nextFurnaceHint?: string;
  generatedAt: string;
}

let __pid = 0;
export function nextPipelineId(prefix: "P3M" | "P3MR"): string {
  __pid += 1;
  return `${prefix}-${Date.now().toString(36)}-${__pid.toString(36)}`;
}
