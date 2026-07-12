// AetherSeed Unattended Training Factory · 运行时
import type {
  FailureRecoveryPlan,
  FailureType,
  SleepProtectionChecklist,
  UnattendedTrainingMethod,
  UnattendedTrainingRun,
} from "./unattendedTypes";
import { listRuns, patchRun, saveRecoveryPlan, saveRun } from "./unattendedStore";
import { createExperiment } from "@/lib/aetherseed-experiment-ledger/experimentLedgerRuntime";
import { patchExperiment } from "@/lib/aetherseed-experiment-ledger/experimentLedgerStore";
import type {
  ExperimentTargetModel,
  ExperimentType,
} from "@/lib/aetherseed-experiment-ledger/experimentLedgerTypes";

function nextId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function inferExperimentTarget(name: string): ExperimentTargetModel {
  const n = name.toLowerCase();
  if (n.includes("10m")) return "AETHERSEED_10M";
  if (n.includes("50m")) return "AETHERSEED_50M";
  if (n.includes("100m")) return "AETHERSEED_100M";
  if (n.includes("700m")) return "AETHERSEED_700M";
  if (n.includes("1.5b") || n.includes("1_5b")) return "AETHERSEED_1_5B";
  if (n.includes("3b")) return "AETHERSEED_3B";
  if (n.includes("7b")) return "AETHERSEED_7B";
  if (n.includes("router")) return "ROUTER_TINY";
  if (n.includes("msl")) return "MSL_TINY";
  if (n.includes("format")) return "FORMAT_TINY";
  return "AETHERSEED_300M";
}

function inferExperimentType(method: UnattendedTrainingMethod): ExperimentType {
  switch (method) {
    case "SFT":
    case "VLM_SFT":
      return "SFT";
    case "LORA":
    case "VLM_LORA":
      return "LORA";
    case "QLORA":
      return "QLORA";
    case "CONTINUED_TRAINING":
      return "PRETRAIN";
    default:
      return "LOCAL_TRAINING";
  }
}

export interface CreateRunInput {
  targetModelName: string;
  baseModelId?: string;
  trainingMethod: UnattendedTrainingMethod;
  datasetVersionId: string;
  daemonRunning?: boolean;
}

export function createUnattendedRun(input: CreateRunInput): UnattendedTrainingRun {
  const id = nextId("utr");
  const checklist: SleepProtectionChecklist = {
    pluggedIn: "UNKNOWN",
    systemSleepDisabled: "UNKNOWN",
    screenSleepAllowed: true,
    daemonRunning: input.daemonRunning ?? false,
  };
  const run: UnattendedTrainingRun = {
    id,
    targetModelName: input.targetModelName,
    baseModelId: input.baseModelId,
    trainingMethod: input.trainingMethod,
    datasetVersionId: input.datasetVersionId,
    configPath: `./AetherSeed/${id}/config.yaml`,
    commandPreview: buildCommandPreview(input, id),
    status: "DRAFT",
    updatedAt: new Date().toISOString(),
    logPath: `./AetherSeed/${id}/logs/train.log`,
    checkpointDir: `./AetherSeed/${id}/checkpoints/`,
    autoEvalEnabled: true,
    autoLedgerEnabled: true,
    autoNextPlanEnabled: true,
    sleepProtectionChecklist: checklist,
    userConfirmed: false,
  };
  return saveRun(run);
}

function buildCommandPreview(input: CreateRunInput, id: string): string {
  const base = `python train.py --run-id ${id} --method ${input.trainingMethod} --dataset ${input.datasetVersionId}`;
  return input.baseModelId ? `${base} --base-model ${input.baseModelId}` : base;
}

export function confirmRun(id: string): UnattendedTrainingRun | undefined {
  return patchRun(id, { userConfirmed: true, status: "READY" });
}

export function startRun(id: string): UnattendedTrainingRun | undefined {
  const existing = listRuns().find((r) => r.id === id);
  if (!existing) return undefined;

  // 真实写入实验账本（P0-2）
  let experimentId = existing.experimentId;
  if (!experimentId) {
    try {
      const exp = createExperiment({
        name: `无人训练 · ${existing.targetModelName}`,
        experimentType: inferExperimentType(existing.trainingMethod),
        targetModel: inferExperimentTarget(existing.targetModelName),
        datasetVersionId: existing.datasetVersionId,
        location: "LOCAL_PC",
      });
      // 立刻进入 RUNNING_MANUAL（守护器接管）
      patchExperiment(exp.id, {
        status: "RUNNING_MANUAL",
        startedAt: new Date().toISOString(),
        notes:
          `runId=${id} · configPath=${existing.configPath} · ` +
          `logPath=${existing.logPath} · checkpointDir=${existing.checkpointDir}`,
      });
      experimentId = exp.id;
    } catch {
      /* 实验账本异常不应阻断训练 run */
    }
  }

  const run = patchRun(id, {
    status: "RUNNING",
    startedAt: new Date().toISOString(),
    lastHeartbeatAt: new Date().toISOString(),
    experimentLedgerId: experimentId ?? `EXP_${id}`,
    experimentId,
  });
  return run;
}

export function pauseRun(id: string): UnattendedTrainingRun | undefined {
  const run = patchRun(id, { status: "PAUSED" });
  if (run?.experimentId) {
    patchExperiment(run.experimentId, { notes: `${new Date().toISOString()} · 已暂停` });
  }
  return run;
}
export function resumeRun(id: string): UnattendedTrainingRun | undefined {
  const run = patchRun(id, { status: "RUNNING", lastHeartbeatAt: new Date().toISOString() });
  if (run?.experimentId) {
    patchExperiment(run.experimentId, {
      status: "RUNNING_MANUAL",
      notes: `${new Date().toISOString()} · 已恢复`,
    });
  }
  return run;
}
export function cancelRun(id: string): UnattendedTrainingRun | undefined {
  const run = patchRun(id, { status: "CANCELLED", completedAt: new Date().toISOString() });
  if (run?.experimentId) {
    patchExperiment(run.experimentId, {
      status: "ARCHIVED",
      completedAt: new Date().toISOString(),
      notes: `${new Date().toISOString()} · 已取消`,
    });
  }
  return run;
}

export function simulateCheckpoint(id: string, name: string): UnattendedTrainingRun | undefined {
  return patchRun(id, {
    latestCheckpoint: `${id}/checkpoints/${name}`,
    lastHeartbeatAt: new Date().toISOString(),
  });
}

export function completeRun(id: string, evalSummary?: string): UnattendedTrainingRun | undefined {
  const run = patchRun(id, {
    status: "COMPLETED",
    completedAt: new Date().toISOString(),
    evalSummary: evalSummary ?? "自动评测：基础冒烟通过（占位摘要）",
    nextPlanSummary: "建议下一炉：提升中长样本比例至 35%，将 maxSteps 提升 1.5×",
  });
  if (run?.experimentId) {
    patchExperiment(run.experimentId, {
      status: "COMPLETED_MANUAL",
      completedAt: new Date().toISOString(),
      notes: `${new Date().toISOString()} · 已完成 · ${run.evalSummary ?? ""}`,
    });
  }
  return run;
}

/** 由 auto-training dry-run 调用，把 dry-run 结果 id 写回 run，做真实绑定。 */
export function attachDryRunToRun(
  runId: string,
  dryRunResultId: string,
): UnattendedTrainingRun | undefined {
  return patchRun(runId, { dryRunResultId });
}

export function failRun(id: string, failureType: FailureType, reason: string): {
  run: UnattendedTrainingRun | undefined;
  plan: FailureRecoveryPlan;
} {
  const plan = planRecovery(id, failureType, reason);
  saveRecoveryPlan(plan);
  const run = patchRun(id, {
    status: "FAILED",
    completedAt: new Date().toISOString(),
    failureReason: reason,
    recoverySuggestion: plan.recommendedActions.join("；"),
  });
  return { run, plan };
}

function planRecovery(runId: string, failureType: FailureType, reason: string): FailureRecoveryPlan {
  const run = listRuns().find((r) => r.id === runId);
  const latest = run?.latestCheckpoint;
  const actions: string[] = [];
  const patch: Record<string, unknown> = {};
  switch (failureType) {
    case "OOM":
      actions.push("降低 batchSize", "启用 QLoRA（4bit）", "缩短 contextLength");
      patch.batchSize = "halve";
      patch.method = "QLORA";
      break;
    case "DATA_ERROR":
      actions.push("重建数据集版本", "复查 BLOCK 样本是否泄漏");
      break;
    case "MISSING_FILE":
      actions.push("检查 configPath / datasetFile 是否存在", "在本机重新导出训练包");
      break;
    case "ENV_ERROR":
      actions.push("检查本地守护器是否运行", "确认 Python / CUDA 环境");
      break;
    case "CHECKPOINT_ERROR":
      actions.push("回滚到上一个 checkpoint", "减少 saveSteps 间隔");
      break;
    case "USER_CANCELLED":
      actions.push("用户主动取消，可重新启动或从 checkpoint 续训");
      break;
    default:
      actions.push("查看完整日志后人工判断");
  }
  return {
    runId,
    failureType,
    summary: reason,
    recommendedActions: actions,
    canResumeFromCheckpoint: Boolean(latest),
    latestCheckpoint: latest,
    nextRunConfigPatch: Object.keys(patch).length ? patch : undefined,
  };
}

export function summarizeRun(run: UnattendedTrainingRun): string {
  return [
    `任务：${run.targetModelName}（${run.trainingMethod}）`,
    `状态：${run.status}`,
    `runId：${run.id}`,
    run.latestCheckpoint ? `最新 checkpoint：${run.latestCheckpoint}` : "尚无 checkpoint",
    run.failureReason ? `失败原因：${run.failureReason}` : "",
    run.nextPlanSummary ? `下一炉：${run.nextPlanSummary}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
