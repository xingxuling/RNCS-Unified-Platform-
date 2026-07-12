// Aetherworld Autonomous Factory OS · 类型定义
export type FactoryKind = "MATERIAL" | "TRAINING" | "COMPANY";

export type FactoryTaskType =
  | "INTAKE"
  | "DATASET_BUILD"
  | "EXPORT"
  | "TRAINING_PLAN"
  | "DRY_RUN"
  | "TRAINING_RUN"
  | "EVAL"
  | "LEDGER_WRITE"
  | "CAPABILITY_PACKAGE"
  | "STORE_DRAFT"
  | "FEEDBACK_TO_DATASET"
  | "RECOVERY";

export type FactoryTaskStatus =
  | "WAITING"
  | "RUNNING"
  | "NEEDS_CONFIRMATION"
  | "COMPLETED"
  | "FAILED"
  | "PAUSED"
  | "BLOCKED";

export type FactoryTaskPriority = "P0" | "P1" | "P2" | "P3";

export type AutomationLevel = "L0" | "L1" | "L2" | "L3" | "L4";

export const AUTOMATION_LEVEL_LABEL: Record<AutomationLevel, string> = {
  L0: "L0 手动",
  L1: "L1 半自动（系统建议）",
  L2: "L2 一键执行",
  L3: "L3 无人值守",
  L4: "L4 自进化建议",
};

export interface AutonomousFactoryTask {
  id: string;
  factory: FactoryKind;
  taskType: FactoryTaskType;
  title: string;
  status: FactoryTaskStatus;
  priority: FactoryTaskPriority;
  automationLevel: AutomationLevel;
  inputRefs: string[];
  outputRefs: string[];
  notes: string[];
  failureReason?: string;
  recoveryHint?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FactoryOverview {
  todayCount: number;
  running: number;
  failed: number;
  completed: number;
  generatedAssets: number;
  generatedSamples: number;
  trainingStatus: string;
  nextSuggestion: string;
}

export interface MaterialFactoryCard {
  recentIntake: string;
  samplePool: number;
  longCorpusTokens: number;
  pendingReview: number;
  sealedDatasets: number;
  exportableBundles: number;
  nextStep: string;
}

export interface TrainingFactoryCard {
  targetModel: string;
  activeRun: string;
  daemonStatus: "READY" | "OFFLINE" | "UNKNOWN";
  latestCheckpoint: string;
  latestLog: string;
  latestExperiment: string;
  nextPlan: string;
  unattended: boolean;
}

export interface CompanyFactoryCard {
  assetCandidates: number;
  userUploads: number;
  storeDrafts: number;
  publishablePages: number;
  pendingReview: number;
  revenueRoute: string;
  nextStep: string;
}
