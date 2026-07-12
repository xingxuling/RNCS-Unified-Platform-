// 失败重试策略：按 taskType 设定最大次数。
import type { AetherTask, AetherTaskType } from "./aetherSchedulerTypes";

const MAX_RETRIES: Record<AetherTaskType, number> = {
  MODEL_ANSWER: 1,
  APP_CREATE: 1,
  CODE_CHECK: 2,
  CODE_REPAIR: 2,
  WORLD_GENERATE: 1,
  MUSIC_CREATE: 1,
  WORKSPACE_SAVE: 2,
  CALENDAR_REMINDER: 0,
  STORE_INSTALL: 0,
  SOCIAL_DRAFT: 0,
  QA_AUDIT: 1,
  BUG_AUDIT: 1,
  PREDICTION_RUN: 1,
  SEQUENCE_MEMORY_COMPRESS: 1,
  SEQUENCE_CURRENCY_RECORD: 1,
  MSL_STATE_RECORD: 1,
  FOLLOW_UP_REVIEW: 0,
  CUSTOM: 0,
};

export function shouldRetry(task: AetherTask): boolean {
  const limit = MAX_RETRIES[task.taskType] ?? 0;
  return (task.retries ?? 0) < limit;
}

export function incrementRetry(task: AetherTask): AetherTask {
  return { ...task, retries: (task.retries ?? 0) + 1, updatedAt: new Date().toISOString() };
}
