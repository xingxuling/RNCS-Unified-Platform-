// 任务状态机：受 Constants Universe 思想约束，防止任意跳转。
import {
  AETHER_TASK_STATUS_TRANSITIONS,
  type AetherTask,
  type AetherTaskStatus,
} from "./aetherSchedulerTypes";

export function canTransition(from: AetherTaskStatus, to: AetherTaskStatus): boolean {
  if (from === to) return true;
  return AETHER_TASK_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function applyTransition(
  task: AetherTask,
  next: AetherTaskStatus,
  patch: Partial<AetherTask> = {},
): AetherTask {
  if (!canTransition(task.status, next)) {
    // eslint-disable-next-line no-console
    console.warn(`[scheduler] 非法状态迁移 ${task.status} → ${next}，已忽略。`);
    return task;
  }
  return {
    ...task,
    ...patch,
    status: next,
    updatedAt: new Date().toISOString(),
  };
}

export function isTerminal(status: AetherTaskStatus): boolean {
  return status === "ARCHIVED" || status === "CANCELLED" || status === "RELEASED";
}
