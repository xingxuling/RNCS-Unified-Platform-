// AetherSeed Auto Training Executor · 运行时编排
// 不真实执行训练；编排 Task / Dry-run / Command / Run / Log / Experiment 回写。
import type { LocalTrainingBundle } from "@/lib/aetherseed-local-training/localTrainingRuntime";
import {
  nextAutoTrainingId,
  type AutoTrainingLevel,
  type AutoTrainingTask,
  type AutoTrainingTaskSource,
} from "./autoTrainingTypes";
import {
  saveTask,
  updateTaskStatus,
  saveCommands,
  saveDryRun,
  saveRun,
  getTask,
  getCommands,
  getDryRun,
} from "./autoTrainingTaskStore";
import { buildAutoTrainingCommands } from "./autoTrainingCommandBuilder";
import { runDryRun } from "./autoTrainingDryRun";
import {
  bindExperimentForTask,
  reportRunCompleted,
  reportRunFailed,
  reportRunStarted,
} from "./autoTrainingExperimentBridge";
import { recordAutoTrainingEvent } from "./autoTrainingRecordBridge";
import { emitWorkflowStep } from "./autoTrainingWorkflowBridge";
import { markRunStatus } from "./autoTrainingStatusWatcher";
import { patchRun as patchUnattendedRun } from "@/lib/aetherseed-unattended/unattendedStore";
import { appendLog } from "./autoTrainingLogStore";

export interface CreateAutoTrainingTaskInput {
  bundle: LocalTrainingBundle;
  source?: AutoTrainingTaskSource;
  level?: AutoTrainingLevel;
  workflowRunId?: string;
  experimentId?: string;
  hasBlockedSamples?: boolean;
}

export function createAutoTrainingTask(input: CreateAutoTrainingTaskInput): AutoTrainingTask {
  const now = new Date().toISOString();
  const task: AutoTrainingTask = {
    id: nextAutoTrainingId("AT"),
    name: `Auto Training · ${input.bundle.plan.name}`,
    source: input.source ?? "LOCAL_TRAINING_PLAN",
    localTrainingPlanId: input.bundle.plan.id,
    workflowRunId: input.workflowRunId,
    experimentId: input.experimentId,
    datasetVersionId: input.bundle.plan.datasetVersionId,
    level: input.level ?? "L2_CONFIRM_TO_RUN",
    status: "DRAFT",
    safetyStatus: input.bundle.plan.safetyStatus === "BLOCK" ? "BLOCK" : input.bundle.plan.safetyStatus,
    blockedReasons: [],
    createdAt: now,
    updatedAt: now,
  };
  saveTask(task);
  recordAutoTrainingEvent("AUTO_TRAINING_TASK_CREATED", { taskId: task.id });
  emitWorkflowStep({ workflowRunId: input.workflowRunId ?? task.id, step: "BUILD_LOCAL_TRAINING_PLAN", status: "COMPLETED" });
  return task;
}

export function performDryRun(
  taskId: string,
  bundle: LocalTrainingBundle,
  hasBlockedSamples = false,
  unattendedRunId?: string,
) {
  const cmds = buildAutoTrainingCommands(taskId, bundle);
  saveCommands(taskId, cmds);
  const dry = runDryRun({ taskId, bundle, commands: cmds, hasBlockedSamples });
  saveDryRun(dry);
  recordAutoTrainingEvent("AUTO_TRAINING_DRY_RUN_COMPLETED", { taskId, note: `risk=${dry.estimatedRisk} env=${dry.environmentStatus}` });
  // P0-4：若传入了 unattendedRunId，则把 dry-run 结果回写到该无人训练任务
  if (unattendedRunId) {
    try {
      patchUnattendedRun(unattendedRunId, { dryRunResultId: dry.id });
    } catch {
      /* 静默：unattended 模块不可用时不阻断 dry-run */
    }
  }
  const task = getTask(taskId);
  if (!task) return { dryRun: dry, commands: cmds };
  if (dry.blockedReasons.length) {
    updateTaskStatus(taskId, "BLOCKED", { blockedReasons: dry.blockedReasons, safetyStatus: "BLOCK" });
    recordAutoTrainingEvent("AUTO_TRAINING_BLOCKED", { taskId, note: dry.blockedReasons.join("; ") });
  } else if (task.level === "L0_PLAN_ONLY" || task.level === "L1_COMMAND_PREVIEW") {
    updateTaskStatus(taskId, "DRY_RUN_READY");
  } else {
    updateTaskStatus(taskId, "WAITING_CONFIRMATION", { safetyStatus: dry.warnings.length ? "WARN" : "PASS" });
    recordAutoTrainingEvent("AUTO_TRAINING_WAITING_CONFIRMATION", { taskId });
    emitWorkflowStep({ workflowRunId: task.workflowRunId ?? task.id, step: "AUTO_TRAINING_DRY_RUN", status: "COMPLETED" });
    emitWorkflowStep({ workflowRunId: task.workflowRunId ?? task.id, step: "WAITING_CONFIRMATION", status: "WAITING" });
  }
  return { dryRun: dry, commands: cmds };
}

export interface ConfirmAndStartInput {
  taskId: string;
  bundle: LocalTrainingBundle;
}

/** 用户确认后启动：当前安全降级——不真实执行 spawn，标记 READY_TO_RUN 并写入 system 日志。 */
export function confirmAndStart(input: ConfirmAndStartInput) {
  const task = getTask(input.taskId);
  if (!task) throw new Error("Task not found");
  const dry = getDryRun(input.taskId);
  if (!dry || dry.blockedReasons.length) {
    throw new Error("Dry-run 未通过或被拦截，不允许启动");
  }
  // 绑定 Experiment（如未绑定）
  const experimentId = task.experimentId ?? bindExperimentForTask(task, input.bundle.plan);
  updateTaskStatus(input.taskId, "READY_TO_RUN", { experimentId });

  // 创建 Run（STARTING）
  const run = saveRun({
    id: nextAutoTrainingId("RUN"),
    taskId: input.taskId,
    status: "STARTING",
    startedAt: new Date().toISOString(),
    checkpointIds: [],
    experimentId,
  });
  appendLog(run.id, "system", `Auto Training Executor 启动（命令仅供本地手动执行参考；当前环境=${dry.environmentStatus}）`);
  for (const c of getCommands(input.taskId)) {
    appendLog(run.id, "system", `[command] ${c.executable} ${c.args.join(" ")}  # wd=${c.workingDirectory}`);
  }
  reportRunStarted(run);
  recordAutoTrainingEvent("AUTO_TRAINING_STARTED", { taskId: input.taskId, runId: run.id });

  if (dry.environmentStatus === "NEEDS_LOCAL_GATEWAY") {
    appendLog(run.id, "system", "未检测到本地网关 / Electron IPC：未真实执行；请按命令在本机手动运行。");
    markRunStatus(run.id, "CANCELLED", { note: "NEEDS_LOCAL_GATEWAY · 浏览器安全降级" });
    updateTaskStatus(input.taskId, "WAITING_CONFIRMATION", {
      blockedReasons: ["需要本地网关 / Electron IPC 才能真实执行；当前仅生成预览。"],
    });
  } else {
    // 进入 RUNNING（仍未真实 spawn——保留以便后续 IPC 适配）
    markRunStatus(run.id, "RUNNING", { note: "等待安全 IPC 适配接入" });
    updateTaskStatus(input.taskId, "RUNNING");
  }
  return run;
}

export function markTaskCompleted(taskId: string, runId: string, note?: string) {
  const run = markRunStatus(runId, "COMPLETED", { note });
  if (run) reportRunCompleted(run);
  updateTaskStatus(taskId, "COMPLETED");
  recordAutoTrainingEvent("AUTO_TRAINING_COMPLETED", { taskId, runId });
}

export function markTaskFailed(taskId: string, runId: string, reason: string) {
  const run = markRunStatus(runId, "FAILED", { note: reason });
  if (run) reportRunFailed(run, reason);
  updateTaskStatus(taskId, "FAILED", { blockedReasons: [reason] });
  recordAutoTrainingEvent("AUTO_TRAINING_FAILED", { taskId, runId, note: reason });
}

export function cancelTask(taskId: string, runId?: string) {
  if (runId) markRunStatus(runId, "CANCELLED", { note: "用户取消" });
  updateTaskStatus(taskId, "CANCELLED");
}
