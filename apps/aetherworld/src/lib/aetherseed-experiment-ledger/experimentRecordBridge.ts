// AetherSeed Experiment Ledger · Record Center 桥
import type {
  AetherSeedExperiment,
  CheckpointRecord,
  ExperimentFailureReport,
  ExperimentMetrics,
  NextExperimentPlan,
} from "./experimentLedgerTypes";

export type ExperimentRecordEvent =
  | "EXPERIMENT_CREATED"
  | "EXPERIMENT_STARTED"
  | "EXPERIMENT_COMPLETED"
  | "EXPERIMENT_FAILED"
  | "CHECKPOINT_REGISTERED"
  | "METRICS_RECORDED"
  | "NEXT_PLAN_CREATED";

function base(event: ExperimentRecordEvent, experimentId: string) {
  return {
    recordType: "AETHERSEED_EXPERIMENT_LEDGER",
    event,
    experimentId,
    createdAt: new Date().toISOString(),
  };
}

export function recordExperimentCreated(exp: AetherSeedExperiment) {
  return {
    ...base("EXPERIMENT_CREATED", exp.id),
    targetModel: exp.targetModel,
    experimentType: exp.experimentType,
    status: exp.status,
  };
}
export function recordExperimentStarted(exp: AetherSeedExperiment) {
  return { ...base("EXPERIMENT_STARTED", exp.id), startedAt: exp.startedAt };
}
export function recordExperimentCompleted(exp: AetherSeedExperiment) {
  return { ...base("EXPERIMENT_COMPLETED", exp.id), completedAt: exp.completedAt };
}
export function recordExperimentFailed(exp: AetherSeedExperiment, failure?: ExperimentFailureReport) {
  return {
    ...base("EXPERIMENT_FAILED", exp.id),
    failureType: failure?.failureType,
    summary: failure?.summary,
  };
}
export function recordCheckpointRegistered(c: CheckpointRecord) {
  return {
    ...base("CHECKPOINT_REGISTERED", c.experimentId),
    checkpointId: c.id,
    modelFormat: c.modelFormat,
  };
}
export function recordMetricsRecorded(m: ExperimentMetrics) {
  return { ...base("METRICS_RECORDED", m.experimentId), metricsId: m.id };
}
export function recordNextPlanCreated(p: NextExperimentPlan) {
  return {
    ...base("NEXT_PLAN_CREATED", p.basedOnExperimentId),
    nextPlanId: p.id,
    recommendationType: p.recommendationType,
    priority: p.priority,
  };
}
