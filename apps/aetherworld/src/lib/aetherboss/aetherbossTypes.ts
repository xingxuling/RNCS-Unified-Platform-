// AetherBoss · 长时间自动总策 Agent · 类型定义
export type AetherBossMode =
  | "OBSERVE_ONLY"
  | "PLAN_ONLY"
  | "SEMI_AUTO"
  | "UNATTENDED"
  | "COMPETITION_MODE";

export const MODE_LABEL: Record<AetherBossMode, string> = {
  OBSERVE_ONLY: "只观察",
  PLAN_ONLY: "只规划",
  SEMI_AUTO: "半自动",
  UNATTENDED: "无人值守",
  COMPETITION_MODE: "竞争模式",
};

export const MODE_INTERVAL_MINUTES: Record<AetherBossMode, number> = {
  OBSERVE_ONLY: 60,
  PLAN_ONLY: 45,
  SEMI_AUTO: 30,
  UNATTENDED: 15,
  COMPETITION_MODE: 10,
};

export type AetherBossPriority = "P0" | "P1" | "P2" | "P3";

export type AetherBossFactory = "MATERIAL" | "TRAINING" | "COMPANY" | "SYSTEM_HEALTH";

export const FACTORY_LABEL: Record<AetherBossFactory, string> = {
  MATERIAL: "材料工厂",
  TRAINING: "训练工厂",
  COMPANY: "公司工厂",
  SYSTEM_HEALTH: "系统健康",
};

export type AetherBossAction =
  | "INTAKE_MORE_MATERIAL"
  | "BUILD_DATASET_VERSION"
  | "EXPORT_TRAINING_PACKAGE"
  | "CREATE_TRAINING_PLAN"
  | "RUN_DRY_RUN"
  | "START_UNATTENDED_TRAINING"
  | "RECOVER_FAILED_TASK"
  | "CREATE_CAPABILITY_PACKAGE"
  | "CREATE_STORE_DRAFT"
  | "TURN_FEEDBACK_INTO_DATA"
  | "FIX_BROKEN_ROUTE"
  | "GENERATE_NEXT_PROMPT"
  | "WAIT";

export const ACTION_LABEL: Record<AetherBossAction, string> = {
  INTAKE_MORE_MATERIAL: "继续投喂材料",
  BUILD_DATASET_VERSION: "构建数据集版本",
  EXPORT_TRAINING_PACKAGE: "导出训练包",
  CREATE_TRAINING_PLAN: "生成训练计划草案",
  RUN_DRY_RUN: "执行训练 dry-run",
  START_UNATTENDED_TRAINING: "启动无人值守训练（需确认）",
  RECOVER_FAILED_TASK: "恢复失败任务",
  CREATE_CAPABILITY_PACKAGE: "封装能力包草案",
  CREATE_STORE_DRAFT: "生成商店草案",
  TURN_FEEDBACK_INTO_DATA: "把用户反馈转成训练样本候选",
  FIX_BROKEN_ROUTE: "修复异常路由",
  GENERATE_NEXT_PROMPT: "生成下一步 Prompt 建议",
  WAIT: "暂不行动",
};

export interface AetherBossDecision {
  id: string;
  agentRunId: string;
  observationSummary: string;
  priority: AetherBossPriority;
  chosenFactory: AetherBossFactory;
  chosenAction: AetherBossAction;
  reason: string;
  expectedValue: string;
  requiredConfirmation: boolean;
  generatedTaskIds: string[];
  createdAt: string;
}

export interface AetherBossRun {
  id: string;
  startedAt: string;
  finishedAt?: string;
  mode: AetherBossMode;
  observationSummary: string;
  decisionIds: string[];
  notes: string[];
}

export interface HeartbeatSchedule {
  id: string;
  agentId: string;
  enabled: boolean;
  intervalMinutes: number;
  lastRunAt?: string;
  nextRunAt?: string;
  mode: AetherBossMode;
}

export type RecoveryFailureKind =
  | "DATA_ERROR"
  | "ROUTE_ERROR"
  | "TSC_ERROR"
  | "TRAINING_ERROR"
  | "LOCAL_GATEWAY_ERROR"
  | "DATASET_EXPORT_ERROR"
  | "PERMISSION_ERROR"
  | "UNKNOWN";

export const RECOVERY_LABEL: Record<RecoveryFailureKind, string> = {
  DATA_ERROR: "数据错误",
  ROUTE_ERROR: "路由错误",
  TSC_ERROR: "类型检查错误",
  TRAINING_ERROR: "训练错误",
  LOCAL_GATEWAY_ERROR: "本地网关错误",
  DATASET_EXPORT_ERROR: "数据集导出错误",
  PERMISSION_ERROR: "权限错误",
  UNKNOWN: "未知错误",
};

export interface AetherBossRecoveryPlan {
  id: string;
  failedTaskId: string;
  kind: RecoveryFailureKind;
  autoRecoverable: boolean;
  steps: string[];
  needsConfirmation: boolean;
  createdAt: string;
}

export interface AetherBossDailyGrowthReport {
  date: string;
  materialProgress: string;
  trainingProgress: string;
  companyProgress: string;
  systemHealth: string;
  generatedSamples: number;
  generatedTokens: number;
  generatedAssets: number;
  generatedTasks: number;
  completedTasks: number;
  failedTasks: number;
  recoveredTasks: number;
  nextBestActions: string[];
  strategicWarning: string;
}

export interface AetherBossObservation {
  materialPool: number;
  sealedDatasets: number;
  trainingRunning: boolean;
  trainingCompleted: number;
  companyDrafts: number;
  failedTasks: number;
  daemonReady: boolean;
  recentFeedback: number;
  brokenRoutes: number;
  todayTaskCount: number;
}

export interface AetherBossAgentState {
  enabled: boolean;
  mode: AetherBossMode;
  lastRunAt?: string;
  nextRunAt?: string;
  currentGoal: string;
}
