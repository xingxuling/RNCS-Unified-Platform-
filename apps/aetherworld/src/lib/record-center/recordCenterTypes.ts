// Aether Record Center · 类型定义 v0.1
// 统一事实记录层；为回验中心 / 记录权重 / 产品自进化 / Analytics / Prediction 提供原始事实来源。

export type RecordEventType =
  | "CHAT_MESSAGE"
  | "MODEL_CALL"
  | "FUSION_PLAN"
  | "SEQUENCE_MEMORY_CREATED"
  | "SEQUENCE_CURRENCY_EVENT"
  | "MSL_STATE_FRAME"
  | "PREDICTION_RESULT"
  | "SCHEDULER_TASK"
  | "WORKSPACE_OBJECT"
  | "STORE_PACKAGE_USED"
  | "CALENDAR_TRIGGER"
  | "SOCIAL_ACTION"
  | "QA_AUDIT"
  | "BUG_AUDIT"
  | "LEGACY_MODULE_ACTION"
  | "AGENT_RUN"
  | "SEQUENCE_AI_RUN"
  | "SYSTEM_EVENT";

export type RecordStatus = "RECORDED" | "WARN" | "FAILED" | "BLOCKED";
export type RecordSafetyStatus = "PASS" | "WARN" | "BLOCK";
export type RecordVerificationStatus =
  | "PENDING"
  | "PASSED"
  | "FAILED"
  | "PARTIAL"
  | "SKIPPED";

export interface RecordRelatedIds {
  chatSessionId?: string;
  messageId?: string;
  modelCallId?: string;
  fusionPlanId?: string;
  memoryUnitId?: string;
  currencyEventId?: string;
  mslFrameId?: string;
  predictionId?: string;
  taskId?: string;
  workspaceObjectId?: string;
  calendarTaskId?: string;
  socialPostId?: string;
  auditId?: string;
  legacyModuleId?: string;
  agentRunId?: string;
}

export interface RecordEvent {
  id: string;
  eventType: RecordEventType;
  sourceModule: string;
  title: string;
  summary: string;
  relatedIds: RecordRelatedIds;
  status: RecordStatus;
  /** 重要性 0–1，由 importanceScorer 输出 */
  importance: number;
  /** 事实可信度 0–1 */
  confidence: number;
  safetyStatus: RecordSafetyStatus;
  qaStatus?: string;
  tags: string[];
  createdAt: string;

  // ===== 回验中心字段预留 =====
  canVerify?: boolean;
  expectedOutcome?: string;
  verificationDueAt?: string;
  verifiedAt?: string;
  verificationStatus?: RecordVerificationStatus;

  // ===== 记录权重字段预留 =====
  reuseCount?: number;
  verifiedScore?: number;
  decayScore?: number;
  userPinned?: boolean;
  lastReferencedAt?: string;
}

export const EVENT_TYPE_LABEL: Record<RecordEventType, string> = {
  CHAT_MESSAGE: "对话",
  MODEL_CALL: "模型调用",
  FUSION_PLAN: "跨域融合",
  SEQUENCE_MEMORY_CREATED: "数列记忆",
  SEQUENCE_CURRENCY_EVENT: "价值事件",
  MSL_STATE_FRAME: "MSL 状态",
  PREDICTION_RESULT: "预测",
  SCHEDULER_TASK: "调度任务",
  WORKSPACE_OBJECT: "工作区对象",
  STORE_PACKAGE_USED: "商店能力",
  CALENDAR_TRIGGER: "日历触发",
  SOCIAL_ACTION: "社交",
  QA_AUDIT: "QA 审计",
  BUG_AUDIT: "Bug 审计",
  LEGACY_MODULE_ACTION: "旧模块",
  AGENT_RUN: "Agent 运行",
  SEQUENCE_AI_RUN: "数列 AI",
  SYSTEM_EVENT: "系统事件",
};

export const STATUS_LABEL: Record<RecordStatus, string> = {
  RECORDED: "已记录",
  WARN: "警告",
  FAILED: "失败",
  BLOCKED: "阻断",
};

export const SAFETY_LABEL: Record<RecordSafetyStatus, string> = {
  PASS: "通过",
  WARN: "警告",
  BLOCK: "阻断",
};

export interface RecordCenterStats {
  total: number;
  today: number;
  highImportance: number;
  warnCount: number;
  blockCount: number;
  byType: Partial<Record<RecordEventType, number>>;
  canVerifyCount: number;
}

export interface RecordQueryFilter {
  eventType?: RecordEventType | "ALL";
  status?: RecordStatus | "ALL";
  safetyStatus?: RecordSafetyStatus | "ALL";
  minImportance?: number;
  sinceMs?: number;
  limit?: number;
}
