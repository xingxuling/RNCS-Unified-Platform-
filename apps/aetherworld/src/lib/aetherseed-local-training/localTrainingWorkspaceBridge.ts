// AetherSeed Local Training · Workspace 草案桥
import type { LocalTrainingConfig, LocalTrainingPlan, LocalTrainingRunbook } from "./localTrainingTypes";

export function buildLocalTrainingWorkspaceArtifact(
  plan: LocalTrainingPlan,
  cfg: LocalTrainingConfig,
  runbook: LocalTrainingRunbook,
) {
  return {
    artifactType: "LOCAL_TRAINING_PACKAGE",
    plan: {
      id: plan.id,
      name: plan.name,
      target: plan.targetModel,
      mode: plan.trainingMode,
      datasetVersionId: plan.datasetVersionId,
      evalDatasetVersionId: plan.evalDatasetVersionId,
    },
    config: cfg,
    runbookId: runbook.id,
    safetyStatus: plan.safetyStatus,
    persistedAt: new Date().toISOString(),
    note: "Workspace 草案 · 本系统不自动执行训练；由 Founder 在本机手动运行。",
  };
}
