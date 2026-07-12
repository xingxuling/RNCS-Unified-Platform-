// 其他来源 → Scheduler 的轻量桥（统一入口，便于后续各模块按需调用）
import { createAetherTask } from "./aetherSchedulerRuntime";
import type { AetherTaskType } from "./aetherSchedulerTypes";

export function createCalendarTriggeredTask(opts: {
  rawInput: string;
  calendarTaskId?: string;
  hint?: AetherTaskType;
}) {
  return createAetherTask({
    source: "CALENDAR",
    rawInput: opts.rawInput,
    hint: opts.hint ?? "CALENDAR_REMINDER",
    relatedCalendarTaskId: opts.calendarTaskId,
  });
}

export function createPredictionReviewTask(opts: {
  rawInput: string;
  predictionId?: string;
}) {
  return createAetherTask({
    source: "PREDICTION",
    rawInput: opts.rawInput,
    hint: "FOLLOW_UP_REVIEW",
    relatedPredictionId: opts.predictionId,
  });
}

export function createWorkspaceTask(opts: {
  rawInput: string;
  workspaceObjectId?: string;
  hint?: AetherTaskType;
}) {
  return createAetherTask({
    source: "WORKSPACE",
    rawInput: opts.rawInput,
    hint: opts.hint ?? "WORKSPACE_SAVE",
    relatedWorkspaceObjectId: opts.workspaceObjectId,
  });
}

export function createStoreInstallTask(opts: { rawInput: string }) {
  return createAetherTask({
    source: "STORE",
    rawInput: opts.rawInput,
    hint: "STORE_INSTALL",
  });
}

export function createSocialDraftTask(opts: { rawInput: string; workspaceObjectId?: string }) {
  return createAetherTask({
    source: "SOCIAL",
    rawInput: opts.rawInput,
    hint: "SOCIAL_DRAFT",
    relatedWorkspaceObjectId: opts.workspaceObjectId,
  });
}

export function createCodeRepairTask(opts: { rawInput: string; workspaceObjectId?: string }) {
  return createAetherTask({
    source: "CODE_SANDBOX",
    rawInput: opts.rawInput,
    hint: "CODE_REPAIR",
    relatedWorkspaceObjectId: opts.workspaceObjectId,
  });
}

export function createAppRuntimeTask(opts: { rawInput: string }) {
  return createAetherTask({
    source: "APP_RUNTIME",
    rawInput: opts.rawInput,
    hint: "APP_CREATE",
  });
}

export function createMslRecordTask(opts: { rawInput: string; mslFrameId?: string }) {
  return createAetherTask({
    source: "SYSTEM",
    rawInput: opts.rawInput,
    hint: "MSL_STATE_RECORD",
    relatedMslFrameId: opts.mslFrameId,
  });
}

export function createCurrencyRecordTask(opts: { rawInput: string; currencyEventId?: string }) {
  return createAetherTask({
    source: "SYSTEM",
    rawInput: opts.rawInput,
    hint: "SEQUENCE_CURRENCY_RECORD",
    relatedCurrencyEventId: opts.currencyEventId,
  });
}
