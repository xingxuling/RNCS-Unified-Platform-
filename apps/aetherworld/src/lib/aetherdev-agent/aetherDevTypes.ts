// AetherDev AGI · 自进化开发总脑 · 类型定义 v0.1
// 不直接写文件 / 不删除 / 不部署；默认 L2~L3 权限。

export type DevAutomationLevel = "L0" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6";

export type DevAgentRunMode =
  | "OBSERVE"
  | "PLAN"
  | "EXECUTE_DRY_RUN"
  | "PATCH_PREVIEW"
  | "AUTO_FIX_LOW_RISK";

export type DevAgentRunStatus =
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "NEEDS_CONFIRMATION";

export type DevIssueType =
  | "ROUTE"
  | "TYPE_ERROR"
  | "STATE_SYNC"
  | "UI_ONLY"
  | "DATA_FLOW"
  | "LOCAL_GATEWAY"
  | "TRAINING_CHAIN"
  | "FACTORY_CHAIN"
  | "CHAT_BRIDGE"
  | "UNKNOWN";

export type DevRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type DevPriority = "P0" | "P1" | "P2" | "P3";

export type DevCommandStatus = "PASS" | "FAIL" | "SKIPPED" | "NEEDS_LOCAL_GATEWAY";

export type DevToolRecommendation =
  | "CODEX"
  | "CURSOR"
  | "VSCODE_MANUAL"
  | "LOVABLE"
  | "CLOUD_AGI_ONLY"
  | "DEFER";

export interface CostDecision {
  lovableCostRisk: DevRiskLevel;
  codexCostRisk: DevRiskLevel;
  apiCostRisk: DevRiskLevel;
  manualCost: DevRiskLevel;
  recommendedTool: DevToolRecommendation;
  reason: string;
}

export interface DevProjectSnapshot {
  generatedAt: string;
  projectRoot: string;
  pageCompleteness: {
    total: number;
    ready: number;
    placeholder: number;
    runtimeOnly: number;
    pageMissing: number;
    broken: number;
  };
  bugAudit: {
    total: number;
    blockers: number;
    high: number;
    needsReview: number;
  };
  localGateway: {
    detected: boolean;
    statusLabel: string;
    note: string;
  };
  lastTypecheck?: {
    status: DevCommandStatus;
    summary: string;
    at: string;
  };
}

export interface DevTask {
  id: string;
  runId: string;
  title: string;
  priority: DevPriority;
  issueType: DevIssueType;
  targetFiles: string[];
  reason: string;
  expectedChange: string;
  riskLevel: DevRiskLevel;
  acceptanceTests: string[];
  codexPrompt: string;
  cursorPrompt: string;
  vscodeSteps: string[];
  cost: CostDecision;
  createdAt: string;
}

export interface DevCommandCheck {
  id: string;
  runId: string;
  command: string;
  status: DevCommandStatus;
  outputSummary: string;
  rawOutputPreview: string;
  createdAt: string;
}

export interface DevPatchProposal {
  id: string;
  taskId: string;
  targetFiles: string[];
  patchSummary: string;
  riskLevel: DevRiskLevel;
  requiresConfirmation: boolean;
  acceptanceTests: string[];
  createdAt: string;
}

export interface DevAgentRun {
  id: string;
  mode: DevAgentRunMode;
  goal: string;
  projectRoot: string;
  status: DevAgentRunStatus;
  automationLevel: DevAutomationLevel;
  snapshot: DevProjectSnapshot;
  tasks: DevTask[];
  checks: DevCommandCheck[];
  patches: DevPatchProposal[];
  recordedToBugAudit: boolean;
  recordedToRecordCenter: boolean;
  trainingSampleId?: string;
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

export const AETHERDEV_DEFAULT_LEVEL: DevAutomationLevel = "L3";
