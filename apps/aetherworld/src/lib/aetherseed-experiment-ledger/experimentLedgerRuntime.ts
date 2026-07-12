// AetherSeed Experiment Ledger · 运行时（编排）
// 从 LocalTrainingPlan 创建实验；提供生命周期与快照查询。
import {
  type AetherSeedExperiment,
  type ExperimentLocation,
  type ExperimentTargetModel,
  type ExperimentType,
  nextExperimentId,
} from "./experimentLedgerTypes";
import {
  listExperiments,
  listMetricsByExperiment,
  listCheckpointsByExperiment,
  listFailuresByExperiment,
  listNextPlansByExperiment,
  listBloodlines,
  saveExperiment,
  saveFailure,
  saveNextPlan,
} from "./experimentLedgerStore";
import { buildFailureReport, buildNextExperimentPlan } from "./experimentNextStepPlanner";
import type { LocalTrainingPlan } from "@/lib/aetherseed-local-training/localTrainingTypes";

function mapLocalTrainingTargetToExperiment(target: LocalTrainingPlan["targetModel"]): ExperimentTargetModel {
  return target as ExperimentTargetModel;
}

function inferExperimentTypeFromTarget(target: ExperimentTargetModel): ExperimentType {
  switch (target) {
    case "ROUTER_TINY": return "ROUTER_TINY";
    case "MSL_TINY":    return "MSL_TINY";
    case "FORMAT_TINY": return "FORMAT_TINY";
    default:            return "LOCAL_TRAINING";
  }
}

export interface CreateExperimentInput {
  name?: string;
  experimentType?: ExperimentType;
  targetModel: ExperimentTargetModel;
  datasetVersionId?: string;
  evalDatasetVersionId?: string;
  localTrainingPlanId?: string;
  location?: ExperimentLocation;
}

export function createExperiment(input: CreateExperimentInput): AetherSeedExperiment {
  const now = new Date().toISOString();
  const exp: AetherSeedExperiment = {
    id: nextExperimentId("EXP"),
    name: input.name?.trim() || `${input.targetModel} 实验`,
    experimentType: input.experimentType ?? inferExperimentTypeFromTarget(input.targetModel),
    targetModel: input.targetModel,
    datasetVersionId: input.datasetVersionId,
    evalDatasetVersionId: input.evalDatasetVersionId,
    localTrainingPlanId: input.localTrainingPlanId,
    status: input.localTrainingPlanId ? "READY_TO_RUN" : "DRAFT",
    location: input.location ?? (input.localTrainingPlanId ? "LOCAL_PC" : "UNKNOWN"),
    createdAt: now,
    updatedAt: now,
  };
  return saveExperiment(exp);
}

export function createExperimentFromLocalTrainingPlan(
  plan: LocalTrainingPlan,
  opts?: { name?: string },
): AetherSeedExperiment {
  return createExperiment({
    name: opts?.name ?? plan.name,
    experimentType: inferExperimentTypeFromTarget(mapLocalTrainingTargetToExperiment(plan.targetModel)),
    targetModel: mapLocalTrainingTargetToExperiment(plan.targetModel),
    datasetVersionId: plan.datasetVersionId,
    evalDatasetVersionId: plan.evalDatasetVersionId,
    localTrainingPlanId: plan.id,
    location: "LOCAL_PC",
  });
}

// —— 失败 & 下一炉 ——
export function recordFailureAndPlan(experimentId: string, summary: string) {
  const exp = listExperiments().find((e) => e.id === experimentId);
  if (!exp) throw new Error("Experiment not found: " + experimentId);
  const failure = saveFailure(buildFailureReport(experimentId, summary));
  const next = saveNextPlan(buildNextExperimentPlan(exp, undefined, failure));
  return { failure, next };
}

export function generateNextPlan(experimentId: string) {
  const exp = listExperiments().find((e) => e.id === experimentId);
  if (!exp) throw new Error("Experiment not found: " + experimentId);
  const metrics = listMetricsByExperiment(experimentId)[0];
  const failure = listFailuresByExperiment(experimentId)[0];
  const plan = buildNextExperimentPlan(exp, metrics, failure);
  return saveNextPlan(plan);
}

// —— 快照（页面使用）——
export interface ExperimentLedgerSnapshot {
  totalExperiments: number;
  readyToRun: number;
  running: number;
  completed: number;
  failed: number;
  evaluated: number;
  checkpointCount: number;
  bloodlineCount: number;
  recentExperiments: AetherSeedExperiment[];
}

export function buildLedgerSnapshot(): ExperimentLedgerSnapshot {
  const exps = listExperiments();
  let cpTotal = 0;
  for (const e of exps) cpTotal += listCheckpointsByExperiment(e.id).length;
  return {
    totalExperiments: exps.length,
    readyToRun: exps.filter((e) => e.status === "READY_TO_RUN").length,
    running: exps.filter((e) => e.status === "RUNNING_MANUAL").length,
    completed: exps.filter((e) => e.status === "COMPLETED_MANUAL").length,
    failed: exps.filter((e) => e.status === "FAILED_MANUAL").length,
    evaluated: exps.filter((e) => e.status === "EVALUATED").length,
    checkpointCount: cpTotal,
    bloodlineCount: listBloodlines().length,
    recentExperiments: exps.slice(0, 8),
  };
}

export function getExperimentDetail(experimentId: string) {
  const exp = listExperiments().find((e) => e.id === experimentId);
  if (!exp) return undefined;
  return {
    exp,
    metrics: listMetricsByExperiment(experimentId),
    checkpoints: listCheckpointsByExperiment(experimentId),
    failures: listFailuresByExperiment(experimentId),
    nextPlans: listNextPlansByExperiment(experimentId),
  };
}
