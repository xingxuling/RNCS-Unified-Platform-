// Aether Scheduler Runtime · 统一任务编排数据结构
// 复用既有 trigger-calendar / audit / digital-roles workflow 思想，
// 但提供统一的任务生命周期与跨模块入口。

export type AetherTaskSource =
  | "CHAT"
  | "CALENDAR"
  | "PREDICTION"
  | "WORKSPACE"
  | "STORE"
  | "SOCIAL"
  | "CODE_SANDBOX"
  | "APP_RUNTIME"
  | "SYSTEM"
  | "MANUAL";

export type AetherTaskType =
  | "MODEL_ANSWER"
  | "APP_CREATE"
  | "CODE_CHECK"
  | "CODE_REPAIR"
  | "WORLD_GENERATE"
  | "MUSIC_CREATE"
  | "WORKSPACE_SAVE"
  | "CALENDAR_REMINDER"
  | "STORE_INSTALL"
  | "SOCIAL_DRAFT"
  | "QA_AUDIT"
  | "BUG_AUDIT"
  | "PREDICTION_RUN"
  | "SEQUENCE_MEMORY_COMPRESS"
  | "SEQUENCE_CURRENCY_RECORD"
  | "MSL_STATE_RECORD"
  | "FOLLOW_UP_REVIEW"
  | "CUSTOM";

export type AetherTaskStatus =
  | "INTAKE"
  | "CLASSIFY"
  | "PLAN"
  | "ASSIGN"
  | "QUEUED"
  | "RUNNING"
  | "WAITING_CONFIRMATION"
  | "TESTING"
  | "REPAIRING"
  | "QA_AUDIT"
  | "COMPLETED"
  | "FAILED"
  | "BLOCKED"
  | "ARCHIVED"
  | "RELEASED"
  | "CANCELLED";

export type AetherTaskPriority = "P0" | "P1" | "P2" | "P3";
export type AetherSafetyStatus = "PASS" | "WARN" | "BLOCK";

export interface ExecutionStep {
  id: string;
  label: string;
  module: string;
  action: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "BLOCKED";
  requiresConfirmation: boolean;
  resultObjectId?: string;
  error?: string;
}

export interface ExecutionPlan {
  id: string;
  taskId: string;
  steps: ExecutionStep[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "BLOCKED";
  requiredTools: string[];
  expectedOutputs: string[];
  fallbackPlan?: string;
}

export interface AetherTask {
  id: string;
  title: string;
  description?: string;
  source: AetherTaskSource;
  taskType: AetherTaskType;
  status: AetherTaskStatus;
  priority: AetherTaskPriority;
  assignedModule?: string;
  assignedTool?: string;
  requiredConfirmation: boolean;
  relatedChatMessageId?: string;
  relatedWorkspaceObjectId?: string;
  relatedCalendarTaskId?: string;
  relatedPredictionId?: string;
  relatedMslFrameId?: string;
  relatedCurrencyEventId?: string;
  safetyStatus: AetherSafetyStatus;
  qaStatus?: string;
  blockedReason?: string;
  retries?: number;
  plan?: ExecutionPlan;
  createdAt: string;
  updatedAt: string;
}

/** 状态机：合法迁移表 */
export const AETHER_TASK_STATUS_TRANSITIONS: Record<AetherTaskStatus, AetherTaskStatus[]> = {
  INTAKE: ["CLASSIFY", "BLOCKED", "CANCELLED"],
  CLASSIFY: ["PLAN", "BLOCKED", "CANCELLED"],
  PLAN: ["ASSIGN", "WAITING_CONFIRMATION", "BLOCKED", "CANCELLED"],
  ASSIGN: ["QUEUED", "WAITING_CONFIRMATION", "BLOCKED", "CANCELLED"],
  QUEUED: ["RUNNING", "CANCELLED", "BLOCKED"],
  RUNNING: ["TESTING", "QA_AUDIT", "COMPLETED", "FAILED", "WAITING_CONFIRMATION", "REPAIRING", "BLOCKED"],
  WAITING_CONFIRMATION: ["RUNNING", "CANCELLED", "BLOCKED"],
  TESTING: ["QA_AUDIT", "REPAIRING", "FAILED", "COMPLETED"],
  REPAIRING: ["TESTING", "QA_AUDIT", "FAILED", "COMPLETED"],
  QA_AUDIT: ["COMPLETED", "FAILED", "REPAIRING", "BLOCKED"],
  COMPLETED: ["RELEASED", "ARCHIVED"],
  FAILED: ["REPAIRING", "ARCHIVED", "CANCELLED"],
  BLOCKED: ["WAITING_CONFIRMATION", "CANCELLED", "ARCHIVED"],
  RELEASED: ["ARCHIVED"],
  ARCHIVED: [],
  CANCELLED: ["ARCHIVED"],
};

export const TASK_STATUS_LABEL: Record<AetherTaskStatus, string> = {
  INTAKE: "已接收",
  CLASSIFY: "分类中",
  PLAN: "生成计划",
  ASSIGN: "分配模块",
  QUEUED: "排队中",
  RUNNING: "执行中",
  WAITING_CONFIRMATION: "等待确认",
  TESTING: "测试中",
  REPAIRING: "修复中",
  QA_AUDIT: "QA 审计",
  COMPLETED: "已完成",
  FAILED: "失败",
  BLOCKED: "被阻断",
  ARCHIVED: "已归档",
  RELEASED: "已交付",
  CANCELLED: "已取消",
};

export const TASK_TYPE_LABEL: Record<AetherTaskType, string> = {
  MODEL_ANSWER: "模型回答",
  APP_CREATE: "创建应用",
  CODE_CHECK: "代码检查",
  CODE_REPAIR: "代码修复",
  WORLD_GENERATE: "世界生成",
  MUSIC_CREATE: "音乐创作",
  WORKSPACE_SAVE: "保存工作区",
  CALENDAR_REMINDER: "日历提醒",
  STORE_INSTALL: "能力包安装",
  SOCIAL_DRAFT: "社交草稿",
  QA_AUDIT: "QA 审计",
  BUG_AUDIT: "Bug 审计",
  PREDICTION_RUN: "数列预测",
  SEQUENCE_MEMORY_COMPRESS: "记忆压缩",
  SEQUENCE_CURRENCY_RECORD: "价值计量",
  MSL_STATE_RECORD: "MSL 状态",
  FOLLOW_UP_REVIEW: "复查节点",
  CUSTOM: "自定义",
};

export const TASK_SOURCE_LABEL: Record<AetherTaskSource, string> = {
  CHAT: "对话",
  CALENDAR: "日历",
  PREDICTION: "预测",
  WORKSPACE: "工作区",
  STORE: "商店",
  SOCIAL: "社交",
  CODE_SANDBOX: "代码沙箱",
  APP_RUNTIME: "应用运行时",
  SYSTEM: "系统",
  MANUAL: "手动",
};
