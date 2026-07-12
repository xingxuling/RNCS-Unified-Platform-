// 派发器：根据计划与策略推进单个任务（同步推进，不真实执行外部命令）。
import { canTransition, applyTransition, isTerminal } from "./aetherTaskStateMachine";
import { recordSchedulerAudit } from "./aetherTaskAuditBridge";
import { upsertTask } from "./aetherTaskQueue";
import { requiresWaitingConfirmation } from "./aetherSchedulerSafetyPolicy";
import type { AetherTask, AetherTaskStatus } from "./aetherSchedulerTypes";

export function advanceTask(task: AetherTask, next: AetherTaskStatus, patch: Partial<AetherTask> = {}): AetherTask {
  if (!canTransition(task.status, next)) {
    recordSchedulerAudit(task, `非法迁移 ${task.status}→${next}，已忽略`);
    return task;
  }
  const updated = applyTransition(task, next, patch);
  upsertTask(updated);
  recordSchedulerAudit(updated);
  return updated;
}

/** 接收新任务：INTAKE→CLASSIFY→PLAN→ASSIGN→(WAITING_CONFIRMATION | QUEUED) */
export function intakeTask(task: AetherTask): AetherTask {
  upsertTask(task);
  recordSchedulerAudit(task, "任务进入 INTAKE");
  let t = task;
  t = advanceTask(t, "CLASSIFY");
  t = advanceTask(t, "PLAN");
  t = advanceTask(t, "ASSIGN");
  if (requiresWaitingConfirmation(t)) {
    t = advanceTask(t, "WAITING_CONFIRMATION");
  } else {
    t = advanceTask(t, "QUEUED");
  }
  return t;
}

export function confirmTask(task: AetherTask): AetherTask {
  if (task.status !== "WAITING_CONFIRMATION") return task;
  return advanceTask(task, "QUEUED");
}

export function cancelTask(task: AetherTask, reason?: string): AetherTask {
  if (isTerminal(task.status)) return task;
  return advanceTask(task, "CANCELLED", { blockedReason: reason });
}

export function blockTask(task: AetherTask, reason: string): AetherTask {
  return advanceTask(task, "BLOCKED", { blockedReason: reason, safetyStatus: "BLOCK" });
}
