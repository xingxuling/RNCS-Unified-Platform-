// AetherSeed Local Training · Record Center 桥
import type { LocalTrainingExperiment, LocalTrainingPlan } from "./localTrainingTypes";

export function buildLocalTrainingRecordDraft(
  plan: LocalTrainingPlan,
  experiment?: LocalTrainingExperiment,
) {
  return {
    recordType: "LOCAL_TRAINING",
    planId: plan.id,
    targetModel: plan.targetModel,
    trainingMode: plan.trainingMode,
    experimentId: experiment?.id,
    status: experiment?.status ?? "DRAFT",
    safetyStatus: plan.safetyStatus,
    createdAt: new Date().toISOString(),
    note: "Record Center 草案 · 实验状态变化需要由 Founder 手动登记。",
  };
}
