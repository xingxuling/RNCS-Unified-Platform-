// Aether Scheduler Runtime 统一入口：创建 / 推进 / 查询任务。
// 复用既有 trigger-calendar / system-audit / sequence-* 模块；不重复造孤立体系。
import { newTaskId, listTasks, getTask, subscribeTasks } from "./aetherTaskQueue";
import { classifyTask, type ClassifyInput } from "./aetherTaskClassifier";
import { buildExecutionPlan } from "./aetherExecutionPlanner";
import { evaluateTaskSafety } from "./aetherSchedulerSafetyPolicy";
import { intakeTask, advanceTask, confirmTask, cancelTask, blockTask } from "./aetherTaskDispatcher";
import type {
  AetherTask,
  AetherTaskSource,
  AetherTaskType,
} from "./aetherSchedulerTypes";

export interface CreateTaskInput {
  source: AetherTaskSource;
  rawInput: string;
  hint?: AetherTaskType;
  description?: string;
  relatedChatMessageId?: string;
  relatedWorkspaceObjectId?: string;
  relatedCalendarTaskId?: string;
  relatedPredictionId?: string;
  relatedMslFrameId?: string;
  relatedCurrencyEventId?: string;
}

export function createAetherTask(input: CreateTaskInput): AetherTask {
  const cls = classifyTask({ source: input.source, rawInput: input.rawInput, hint: input.hint });
  const now = new Date().toISOString();
  const base: AetherTask = {
    id: newTaskId(),
    title: cls.title,
    description: input.description ?? input.rawInput.slice(0, 200),
    source: input.source,
    taskType: cls.taskType,
    status: "INTAKE",
    priority: cls.priority,
    assignedModule: cls.assignedModule,
    requiredConfirmation: cls.requiredConfirmation,
    safetyStatus: "PASS",
    relatedChatMessageId: input.relatedChatMessageId,
    relatedWorkspaceObjectId: input.relatedWorkspaceObjectId,
    relatedCalendarTaskId: input.relatedCalendarTaskId,
    relatedPredictionId: input.relatedPredictionId,
    relatedMslFrameId: input.relatedMslFrameId,
    relatedCurrencyEventId: input.relatedCurrencyEventId,
    createdAt: now,
    updatedAt: now,
  };

  const safety = evaluateTaskSafety(base, input.rawInput);
  base.safetyStatus = safety.status;
  base.plan = buildExecutionPlan(base);

  if (safety.status === "BLOCK") {
    return blockTask(base, safety.reasons.join("；"));
  }
  return intakeTask(base);
}

export {
  listTasks,
  getTask,
  subscribeTasks,
  advanceTask,
  confirmTask,
  cancelTask,
  blockTask,
};
