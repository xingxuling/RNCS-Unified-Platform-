// AetherSeed Experiment Ledger · 内存存储 v0.1
import {
  type AetherSeedExperiment,
  type CheckpointRecord,
  type ExperimentFailureReport,
  type ExperimentMetrics,
  type ExperimentStatus,
  type ModelBloodlineRecord,
  type NextExperimentPlan,
} from "./experimentLedgerTypes";

const EXPERIMENTS = new Map<string, AetherSeedExperiment>();
const METRICS = new Map<string, ExperimentMetrics>();
const CHECKPOINTS = new Map<string, CheckpointRecord>();
const FAILURES = new Map<string, ExperimentFailureReport>();
const NEXT_PLANS = new Map<string, NextExperimentPlan>();
const BLOODLINES = new Map<string, ModelBloodlineRecord>();

// —— Experiment ——
export function saveExperiment(exp: AetherSeedExperiment): AetherSeedExperiment {
  EXPERIMENTS.set(exp.id, exp);
  return exp;
}
export function getExperiment(id: string): AetherSeedExperiment | undefined {
  return EXPERIMENTS.get(id);
}
export function listExperiments(): AetherSeedExperiment[] {
  return Array.from(EXPERIMENTS.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function patchExperiment(
  id: string,
  patch: Partial<AetherSeedExperiment>,
): AetherSeedExperiment | undefined {
  const cur = EXPERIMENTS.get(id);
  if (!cur) return undefined;
  const next: AetherSeedExperiment = {
    ...cur,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  EXPERIMENTS.set(id, next);
  return next;
}
export function setExperimentStatus(id: string, status: ExperimentStatus) {
  return patchExperiment(id, { status });
}

// —— Metrics ——
export function saveMetrics(m: ExperimentMetrics): ExperimentMetrics {
  METRICS.set(m.id, m);
  return m;
}
export function listMetricsByExperiment(experimentId: string): ExperimentMetrics[] {
  return Array.from(METRICS.values())
    .filter((m) => m.experimentId === experimentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function listAllMetrics(): ExperimentMetrics[] {
  return Array.from(METRICS.values());
}

// —— Checkpoint ——
export function saveCheckpoint(c: CheckpointRecord): CheckpointRecord {
  CHECKPOINTS.set(c.id, c);
  return c;
}
export function listCheckpoints(): CheckpointRecord[] {
  return Array.from(CHECKPOINTS.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function listCheckpointsByExperiment(experimentId: string): CheckpointRecord[] {
  return listCheckpoints().filter((c) => c.experimentId === experimentId);
}

// —— Failure ——
export function saveFailure(f: ExperimentFailureReport): ExperimentFailureReport {
  FAILURES.set(f.id, f);
  return f;
}
export function listFailures(): ExperimentFailureReport[] {
  return Array.from(FAILURES.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function listFailuresByExperiment(experimentId: string): ExperimentFailureReport[] {
  return listFailures().filter((f) => f.experimentId === experimentId);
}

// —— Next Plan ——
export function saveNextPlan(p: NextExperimentPlan): NextExperimentPlan {
  NEXT_PLANS.set(p.id, p);
  return p;
}
export function listNextPlans(): NextExperimentPlan[] {
  return Array.from(NEXT_PLANS.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function listNextPlansByExperiment(experimentId: string): NextExperimentPlan[] {
  return listNextPlans().filter((p) => p.basedOnExperimentId === experimentId);
}

// —— Bloodline ——
export function saveBloodline(b: ModelBloodlineRecord): ModelBloodlineRecord {
  BLOODLINES.set(b.id, b);
  return b;
}
export function listBloodlines(): ModelBloodlineRecord[] {
  return Array.from(BLOODLINES.values()).sort((a, b) => a.generation.localeCompare(b.generation));
}
export function getBloodlineByModel(modelName: string): ModelBloodlineRecord | undefined {
  return listBloodlines().find((b) => b.modelName === modelName);
}

export function clearAllExperimentLedger(): void {
  EXPERIMENTS.clear();
  METRICS.clear();
  CHECKPOINTS.clear();
  FAILURES.clear();
  NEXT_PLANS.clear();
  BLOODLINES.clear();
}
