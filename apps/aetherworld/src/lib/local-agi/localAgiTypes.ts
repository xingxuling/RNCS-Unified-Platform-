// Aetherworld Local AGI · 类型定义
export type LocalAGIMode =
  | "SLEEP"
  | "OBSERVE"
  | "PLAN"
  | "FACTORY_CONTROL"
  | "COMPETITION"
  | "RESEARCH"
  | "DEVELOPMENT";

export const LOCAL_AGI_MODE_LABEL: Record<LocalAGIMode, string> = {
  SLEEP: "休眠",
  OBSERVE: "只观察",
  PLAN: "规划",
  FACTORY_CONTROL: "工厂调度",
  COMPETITION: "竞争模式",
  RESEARCH: "研究模式",
  DEVELOPMENT: "开发模式",
};

export const LOCAL_AGI_INTERVAL_MIN: Record<LocalAGIMode, number> = {
  SLEEP: 240,
  OBSERVE: 90,
  PLAN: 60,
  FACTORY_CONTROL: 30,
  COMPETITION: 15,
  RESEARCH: 120,
  DEVELOPMENT: 30,
};

export type LocalAGIFactory =
  | "MATERIAL"
  | "TRAINING"
  | "COMPANY"
  | "DEVELOPMENT"
  | "SYSTEM_HEALTH";

export const LOCAL_AGI_FACTORY_LABEL: Record<LocalAGIFactory, string> = {
  MATERIAL: "材料工厂",
  TRAINING: "训练工厂",
  COMPANY: "公司工厂",
  DEVELOPMENT: "开发工厂",
  SYSTEM_HEALTH: "系统健康工厂",
};

export type LocalAGIPriority = "P0" | "P1" | "P2" | "P3";

export interface LocalAGIHeartbeat {
  enabled: boolean;
  mode: LocalAGIMode;
  intervalMinutes: number;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
  currentFocus: string;
}

export interface LocalAGIAgentState {
  enabled: boolean;
  mode: LocalAGIMode;
  lastRunAt?: string;
  nextRunAt?: string;
  currentGoal: string;
  todayGrowthScore: number;
}

export interface LocalAGIDecision {
  id: string;
  runId: string;
  mode: LocalAGIMode;
  observation: string;
  chosenFactory: LocalAGIFactory;
  chosenTask: string;
  priority: LocalAGIPriority;
  reason: string;
  expectedValue: string;
  requiredConfirmation: boolean;
  generatedOutputs: string[];
  createdAt: string;
}

export interface LocalAGIRun {
  id: string;
  startedAt: string;
  finishedAt?: string;
  mode: LocalAGIMode;
  observation: string;
  decisionIds: string[];
  notes: string[];
}

export type ExternalSourceType =
  | "OPEN_LLM"
  | "OPEN_VLM"
  | "OLLAMA"
  | "LORA_QLORA"
  | "LOCAL_AGENT"
  | "OPEN_CLAW"
  | "COMPETITOR"
  | "AUTONOMOUS_COMPANY"
  | "WORKFLOW"
  | "AI_STORE"
  | "MARKET"
  | "OTHER";

export const EXTERNAL_SOURCE_LABEL: Record<ExternalSourceType, string> = {
  OPEN_LLM: "开源 LLM",
  OPEN_VLM: "开源 VLM",
  OLLAMA: "Ollama 模型",
  LORA_QLORA: "LoRA / QLoRA",
  LOCAL_AGENT: "本地 Agent",
  OPEN_CLAW: "OpenClaw 类 Agent",
  COMPETITOR: "AI 应用竞品",
  AUTONOMOUS_COMPANY: "无人公司",
  WORKFLOW: "自动化工作流",
  AI_STORE: "AI 商店",
  MARKET: "市场机会",
  OTHER: "其他",
};

export interface ExternalSignal {
  id: string;
  topic: string;
  sourceType: ExternalSourceType;
  summary: string;
  strategicValue: "HIGH" | "MEDIUM" | "LOW";
  suggestedAction: string;
  feedToMaterialFactory: boolean;
  createdAt: string;
}

export type FeedbackSource =
  | "USER_CHAT"
  | "LOVABLE_REPORT"
  | "ERROR_LOG"
  | "TRAINING_FAIL"
  | "BROKEN_PAGE"
  | "USER_IDEA"
  | "BUG_AUDIT";

export const FEEDBACK_SOURCE_LABEL: Record<FeedbackSource, string> = {
  USER_CHAT: "用户对话",
  LOVABLE_REPORT: "Lovable 返回",
  ERROR_LOG: "错误日志",
  TRAINING_FAIL: "训练失败",
  BROKEN_PAGE: "页面打不开",
  USER_IDEA: "用户新想法",
  BUG_AUDIT: "Bug 审计",
};

export type AbsorbOutputKind =
  | "DEV_TASK"
  | "TRAINING_SAMPLE"
  | "DATASET_CANDIDATE"
  | "BUG_AUDIT_ITEM"
  | "UX_TASK"
  | "LOVABLE_PROMPT"
  | "FACTORY_TASK";

export const ABSORB_KIND_LABEL: Record<AbsorbOutputKind, string> = {
  DEV_TASK: "开发任务",
  TRAINING_SAMPLE: "训练样本候选",
  DATASET_CANDIDATE: "数据集候选",
  BUG_AUDIT_ITEM: "Bug 审计项",
  UX_TASK: "体验改进任务",
  LOVABLE_PROMPT: "Lovable 提示词草案",
  FACTORY_TASK: "工厂任务",
};

export interface FeedbackItem {
  id: string;
  source: FeedbackSource;
  content: string;
  createdAt: string;
  absorbed: boolean;
  outputs: AbsorbOutput[];
}

export interface AbsorbOutput {
  id: string;
  kind: AbsorbOutputKind;
  title: string;
  payload: string;
  createdAt: string;
}

export type DevTaskKind =
  | "LOVABLE_PROMPT"
  | "CODEX_TASK"
  | "ROUTE_FIX"
  | "UI_IMPROVE"
  | "INTEGRATION"
  | "TEST_PLAN";

export const DEV_TASK_LABEL: Record<DevTaskKind, string> = {
  LOVABLE_PROMPT: "Lovable 提示词",
  CODEX_TASK: "Codex 任务",
  ROUTE_FIX: "路由修复",
  UI_IMPROVE: "UI 改进",
  INTEGRATION: "接线整合",
  TEST_PLAN: "验收测试",
};

export interface DevelopmentTask {
  id: string;
  kind: DevTaskKind;
  title: string;
  body: string;
  acceptance: string[];
  createdAt: string;
}

export interface LocalAGIDailyReport {
  date: string;
  newSamples: number;
  newTokens: number;
  newTasks: number;
  newAssets: number;
  newTrainingPlans: number;
  recoveredTasks: number;
  externalSignals: number;
  absorbedFeedback: number;
  developmentDrafts: number;
  growthScore: number;
  nextBestActions: string[];
  strategicNote: string;
}

export interface LocalAGIObservation {
  materialPool: number;
  sealedDatasets: number;
  trainingRunning: boolean;
  companyDrafts: number;
  failedTasks: number;
  todayTaskCount: number;
  pendingFeedback: number;
  externalSignals: number;
  devDrafts: number;
}
