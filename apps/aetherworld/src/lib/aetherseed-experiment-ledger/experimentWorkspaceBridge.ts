// AetherSeed Experiment Ledger · Workspace 草案桥
import type {
  AetherSeedExperiment,
  CheckpointRecord,
  ExperimentFailureReport,
  ExperimentMetrics,
  ModelBloodlineRecord,
  NextExperimentPlan,
} from "./experimentLedgerTypes";

export function buildExperimentWorkspaceArtifact(exp: AetherSeedExperiment) {
  return {
    artifactType: "AETHERSEED_EXPERIMENT",
    experimentId: exp.id,
    name: exp.name,
    experimentType: exp.experimentType,
    targetModel: exp.targetModel,
    status: exp.status,
    location: exp.location,
    datasetVersionId: exp.datasetVersionId,
    persistedAt: new Date().toISOString(),
    note: "Workspace 草案 · 实验状态由 Founder 手动维护；不自动执行训练。",
  };
}

export function buildMetricsWorkspaceArtifact(m: ExperimentMetrics) {
  return { artifactType: "EXPERIMENT_METRICS", ...m };
}
export function buildCheckpointWorkspaceArtifact(c: CheckpointRecord) {
  return { artifactType: "CHECKPOINT_RECORD", ...c };
}
export function buildFailureWorkspaceArtifact(f: ExperimentFailureReport) {
  return { artifactType: "FAILURE_REPORT", ...f };
}
export function buildNextPlanWorkspaceArtifact(p: NextExperimentPlan) {
  return { artifactType: "NEXT_EXPERIMENT_PLAN", ...p };
}
export function buildBloodlineWorkspaceArtifact(b: ModelBloodlineRecord) {
  return { artifactType: "MODEL_BLOODLINE_RECORD", ...b };
}
