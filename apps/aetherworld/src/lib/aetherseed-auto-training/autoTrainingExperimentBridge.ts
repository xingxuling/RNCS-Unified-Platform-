// AetherSeed Auto Training Executor · Experiment Ledger 桥
import { createExperimentFromLocalTrainingPlan } from "@/lib/aetherseed-experiment-ledger/experimentLedgerRuntime";
import { listExperiments } from "@/lib/aetherseed-experiment-ledger/experimentLedgerStore";
import { registerCheckpoint } from "@/lib/aetherseed-experiment-ledger/checkpointRegistry";
import {
  markExperimentStarted,
  markExperimentCompleted,
  markExperimentFailed,
} from "@/lib/aetherseed-experiment-ledger/experimentResultRecorder";
import type { LocalTrainingPlan } from "@/lib/aetherseed-local-training/localTrainingTypes";
import type { AutoTrainingRun, AutoTrainingTask } from "./autoTrainingTypes";
import { detectCheckpointsFromText } from "./autoTrainingCheckpointDetector";
import { logSummary } from "./autoTrainingLogStore";

function findExperiment(id: string) {
  return listExperiments().find((e) => e.id === id);
}

export function bindExperimentForTask(_task: AutoTrainingTask, plan: LocalTrainingPlan): string {
  const exp = createExperimentFromLocalTrainingPlan(plan, {
    name: `${plan.name} · Auto Executor`,
  });
  return exp.id;
}

export function reportRunStarted(run: AutoTrainingRun) {
  if (!run.experimentId) return;
  const exp = findExperiment(run.experimentId);
  if (exp) markExperimentStarted(exp);
}

export function reportRunCompleted(run: AutoTrainingRun) {
  if (!run.experimentId) return;
  const exp = findExperiment(run.experimentId);
  if (exp) markExperimentCompleted(exp, "Auto Training Executor 标记完成（自动登记，请人工复核）");
  // 自动登记 checkpoint 候选（仅文本路径）
  const text = logSummary(run.id, 200);
  const cps = detectCheckpointsFromText(text);
  for (const cp of cps) {
    registerCheckpoint({
      experimentId: run.experimentId,
      checkpointName: cp.name,
      checkpointPath: cp.path,
      notes: "由 Auto Training Executor 从日志中识别（仅文本，未读取本地文件）",
    });
  }
}

export function reportRunFailed(run: AutoTrainingRun, reason: string) {
  if (!run.experimentId) return;
  const exp = findExperiment(run.experimentId);
  if (exp) markExperimentFailed(exp, `Auto Training Executor 失败：${reason}`);
}
