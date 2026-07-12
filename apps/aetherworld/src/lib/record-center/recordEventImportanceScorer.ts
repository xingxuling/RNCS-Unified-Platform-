// Aether Record Center · 重要性评分
import type { RecordEvent, RecordEventType, RecordStatus, RecordSafetyStatus } from "./recordCenterTypes";

export interface ImportanceInput {
  eventType: RecordEventType;
  status: RecordStatus;
  safetyStatus: RecordSafetyStatus;
  qaStatus?: string;
  tags?: string[];
  userPinned?: boolean;
  relatedLegacyP0?: boolean;
}

const TYPE_BASE: Partial<Record<RecordEventType, number>> = {
  CHAT_MESSAGE: 0.25,
  MODEL_CALL: 0.35,
  FUSION_PLAN: 0.45,
  SEQUENCE_MEMORY_CREATED: 0.45,
  SEQUENCE_CURRENCY_EVENT: 0.35,
  MSL_STATE_FRAME: 0.4,
  PREDICTION_RESULT: 0.65,
  SCHEDULER_TASK: 0.6,
  WORKSPACE_OBJECT: 0.6,
  STORE_PACKAGE_USED: 0.45,
  CALENDAR_TRIGGER: 0.5,
  SOCIAL_ACTION: 0.55,
  QA_AUDIT: 0.55,
  BUG_AUDIT: 0.6,
  LEGACY_MODULE_ACTION: 0.55,
  AGENT_RUN: 0.55,
  SEQUENCE_AI_RUN: 0.55,
  SYSTEM_EVENT: 0.3,
};

/** 计算重要性 0–1 */
export function scoreImportance(input: ImportanceInput): number {
  let s = TYPE_BASE[input.eventType] ?? 0.3;
  if (input.status === "FAILED") s += 0.2;
  if (input.status === "BLOCKED") s += 0.25;
  if (input.status === "WARN") s += 0.1;
  if (input.safetyStatus === "BLOCK") s += 0.2;
  if (input.safetyStatus === "WARN") s += 0.05;
  if (input.qaStatus === "WARN") s += 0.05;
  if (input.qaStatus === "BLOCK") s += 0.15;
  if (input.userPinned) s = Math.max(s, 0.85);
  if (input.relatedLegacyP0) s += 0.1;
  if (input.tags?.includes("P0") || input.tags?.includes("BLOCKER")) s += 0.15;
  if (input.tags?.includes("HIGH")) s += 0.08;
  return Math.max(0, Math.min(1, Number(s.toFixed(3))));
}

/** 默认可信度：成功事件较高，失败 / 阻断较低 */
export function defaultConfidence(status: RecordStatus, safetyStatus: RecordSafetyStatus): number {
  if (status === "BLOCKED" || safetyStatus === "BLOCK") return 0.25;
  if (status === "FAILED") return 0.3;
  if (status === "WARN" || safetyStatus === "WARN") return 0.65;
  return 0.85;
}

export function decorateEventScore(ev: RecordEvent, opts?: { userPinned?: boolean; relatedLegacyP0?: boolean }) {
  ev.importance = scoreImportance({
    eventType: ev.eventType,
    status: ev.status,
    safetyStatus: ev.safetyStatus,
    qaStatus: ev.qaStatus,
    tags: ev.tags,
    userPinned: opts?.userPinned,
    relatedLegacyP0: opts?.relatedLegacyP0,
  });
  ev.confidence = ev.confidence ?? defaultConfidence(ev.status, ev.safetyStatus);
  return ev;
}
