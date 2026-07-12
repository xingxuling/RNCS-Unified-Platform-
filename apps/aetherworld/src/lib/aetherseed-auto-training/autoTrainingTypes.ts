// AetherSeed Auto Training Executor · 类型定义 v0.1
// 核心安全边界：白名单 + dry-run + 用户确认；浏览器环境下只产出命令草案，不真实执行。

export type AutoTrainingLevel =
  | "L0_PLAN_ONLY"
  | "L1_COMMAND_PREVIEW"
  | "L2_CONFIRM_TO_RUN"
  | "L3_SCHEDULED_LOCAL_RUN";

export const AUTO_TRAINING_LEVEL_LABEL: Record<AutoTrainingLevel, string> = {
  L0_PLAN_ONLY: "L0 · 只生成训练计划",
  L1_COMMAND_PREVIEW: "L1 · 命令预览",
  L2_CONFIRM_TO_RUN: "L2 · 用户确认后执行",
  L3_SCHEDULED_LOCAL_RUN: "L3 · 本地定时执行（预留）",
};

export type AutoTrainingTaskSource =
  | "LOCAL_TRAINING_PLAN"
  | "TRAINING_WORKFLOW"
  | "EXPERIMENT_RETRY"
  | "MANUAL";

export type AutoTrainingTaskStatus =
  | "DRAFT"
  | "DRY_RUN_READY"
  | "WAITING_CONFIRMATION"
  | "READY_TO_RUN"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "BLOCKED"
  | "CANCELLED";

export const AUTO_TRAINING_STATUS_LABEL: Record<AutoTrainingTaskStatus, string> = {
  DRAFT: "草稿",
  DRY_RUN_READY: "Dry-run 待执行",
  WAITING_CONFIRMATION: "等待用户确认",
  READY_TO_RUN: "确认完成 · 等待运行",
  RUNNING: "运行中",
  COMPLETED: "已完成",
  FAILED: "失败",
  BLOCKED: "已拦截",
  CANCELLED: "已取消",
};

export type AutoTrainingSafetyStatus = "PASS" | "WARN" | "BLOCK";

export interface AutoTrainingTask {
  id: string;
  name: string;
  source: AutoTrainingTaskSource;
  localTrainingPlanId?: string;
  workflowRunId?: string;
  experimentId?: string;
  datasetVersionId?: string;
  level: AutoTrainingLevel;
  status: AutoTrainingTaskStatus;
  safetyStatus: AutoTrainingSafetyStatus;
  blockedReasons: string[];
  createdAt: string;
  updatedAt: string;
}

export type AutoTrainingEnvironmentStatus =
  | "READY"
  | "MISSING_PYTHON"
  | "MISSING_DEPENDENCIES"
  | "MISSING_DATASET"
  | "NEEDS_LOCAL_GATEWAY"
  | "BLOCKED";

export const AUTO_TRAINING_ENV_LABEL: Record<AutoTrainingEnvironmentStatus, string> = {
  READY: "环境就绪",
  MISSING_PYTHON: "缺少 Python",
  MISSING_DEPENDENCIES: "缺少依赖",
  MISSING_DATASET: "缺少数据集文件",
  NEEDS_LOCAL_GATEWAY: "需要本地网关 / Electron IPC",
  BLOCKED: "已被安全策略阻止",
};

export type AutoTrainingRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface AutoTrainingDryRunResult {
  id: string;
  taskId: string;
  canRun: boolean;
  environmentStatus: AutoTrainingEnvironmentStatus;
  commandPreview: string[];
  workingDirectory?: string;
  expectedInputs: string[];
  expectedOutputs: string[];
  estimatedRisk: AutoTrainingRiskLevel;
  warnings: string[];
  blockedReasons: string[];
  createdAt: string;
}

export type AutoTrainingCommandType =
  | "PYTHON_TRAIN"
  | "PYTHON_EVAL"
  | "INSTALL_REQUIREMENTS"
  | "CHECK_ENV";

export const AUTO_TRAINING_COMMAND_LABEL: Record<AutoTrainingCommandType, string> = {
  PYTHON_TRAIN: "训练 (train.py)",
  PYTHON_EVAL: "评测 (eval.py)",
  INSTALL_REQUIREMENTS: "安装依赖 (requirements.txt)",
  CHECK_ENV: "环境检查 (check_env.py)",
};

export interface AutoTrainingCommand {
  id: string;
  taskId: string;
  commandType: AutoTrainingCommandType;
  executable: "python" | "python3" | "uv" | "conda" | "UNKNOWN";
  args: string[];
  workingDirectory: string;
  whitelistStatus: "PASS" | "BLOCK";
  reason: string;
}

export type AutoTrainingRunStatus =
  | "STARTING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "TIMEOUT";

export const AUTO_TRAINING_RUN_STATUS_LABEL: Record<AutoTrainingRunStatus, string> = {
  STARTING: "启动中",
  RUNNING: "运行中",
  COMPLETED: "已完成",
  FAILED: "失败",
  CANCELLED: "已取消",
  TIMEOUT: "超时",
};

export interface AutoTrainingRun {
  id: string;
  taskId: string;
  status: AutoTrainingRunStatus;
  startedAt?: string;
  completedAt?: string;
  exitCode?: number;
  logId?: string;
  checkpointIds: string[];
  experimentId?: string;
}

export interface AutoTrainingLogEntry {
  id: string;
  runId: string;
  timestamp: string;
  stream: "stdout" | "stderr" | "system";
  line: string;
  redacted: boolean;
}

export interface AutoTrainingResourcePolicy {
  maxRuntimeMinutes: number;
  maxCheckpointSizeMb: number;
  maxLogLines: number;
  allowedWorkingDirectories: string[];
  allowedExecutables: string[];
  forbiddenArgs: string[];
}

export const DEFAULT_AUTO_TRAINING_RESOURCE_POLICY: AutoTrainingResourcePolicy = {
  maxRuntimeMinutes: 720,
  maxCheckpointSizeMb: 8192,
  maxLogLines: 5000,
  allowedWorkingDirectories: ["~/AetherSeed", "./AetherSeed", "./aetherseed_workspace"],
  allowedExecutables: ["python", "python3", "uv", "conda"],
  forbiddenArgs: [
    "rm", "del", "format", "mkfs", "dd",
    "curl", "wget", "git",
    "&&", "||", "|", ";", ">", "<", "`", "$(",
    "/etc/", "/.ssh", ".env", ".pem", ".key",
    "sudo", "chmod",
  ],
};

let __atid = 0;
export function nextAutoTrainingId(prefix: "AT" | "DR" | "CMD" | "RUN" | "LOG"): string {
  __atid += 1;
  return `${prefix}-${Date.now().toString(36)}-${__atid.toString(36)}`;
}
