// AetherSeed Unattended Training Factory · 类型定义
export type DaemonStatus =
  | "DAEMON_OFFLINE"
  | "DAEMON_READY"
  | "TRAINING_QUEUED"
  | "TRAINING_RUNNING"
  | "TRAINING_PAUSED"
  | "TRAINING_FAILED"
  | "TRAINING_COMPLETED"
  | "RECOVERY_AVAILABLE";

export type UnattendedRunStatus =
  | "DRAFT"
  | "READY"
  | "WAITING_ENV"
  | "RUNNING"
  | "PAUSED"
  | "FAILED"
  | "COMPLETED"
  | "CANCELLED";

export type UnattendedTrainingMethod =
  | "SFT"
  | "LORA"
  | "QLORA"
  | "CONTINUED_TRAINING"
  | "VLM_LORA"
  | "VLM_SFT";

export type FailureType =
  | "OOM"
  | "DATA_ERROR"
  | "MISSING_FILE"
  | "ENV_ERROR"
  | "CHECKPOINT_ERROR"
  | "USER_CANCELLED"
  | "UNKNOWN";

export interface SleepProtectionChecklist {
  pluggedIn: boolean | "UNKNOWN";
  systemSleepDisabled: boolean | "UNKNOWN";
  screenSleepAllowed: boolean | "UNKNOWN";
  daemonRunning: boolean;
}

export interface UnattendedTrainingRun {
  id: string;
  targetModelName: string;
  baseModelId?: string;
  trainingMethod: UnattendedTrainingMethod;
  datasetVersionId: string;
  configPath: string;
  commandPreview: string;
  status: UnattendedRunStatus;
  startedAt?: string;
  updatedAt: string;
  completedAt?: string;
  logPath: string;
  checkpointDir: string;
  latestCheckpoint?: string;
  autoEvalEnabled: boolean;
  autoLedgerEnabled: boolean;
  autoNextPlanEnabled: boolean;
  sleepProtectionChecklist: SleepProtectionChecklist;
  failureReason?: string;
  recoverySuggestion?: string;
  userConfirmed: boolean;
  lastHeartbeatAt?: string;
  experimentLedgerId?: string;
  /** 真实绑定的实验账本 id（startRun 时由 createExperiment 写入） */
  experimentId?: string;
  /** 最近一次 dry-run 结果 id（由 auto-training 写回） */
  dryRunResultId?: string;
  nextPlanSummary?: string;
  evalSummary?: string;
}

export interface FailureRecoveryPlan {
  runId: string;
  failureType: FailureType;
  summary: string;
  recommendedActions: string[];
  canResumeFromCheckpoint: boolean;
  latestCheckpoint?: string;
  nextRunConfigPatch?: Record<string, unknown>;
}

export interface PowerStatusReport {
  pluggedIn: boolean | "UNKNOWN";
  systemSleepDisabled: boolean | "UNKNOWN";
  screenSleepAllowed: boolean | "UNKNOWN";
  detectionMethod: "BROWSER_API" | "LOCAL_GATEWAY" | "UNKNOWN";
  recommendation: string;
  manualWindowsHints: string[];
  manualCommandHints: string[];
}
