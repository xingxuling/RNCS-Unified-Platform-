// AetherSeed Local Training · 实验记录存储（内存版 v0.1）
import {
  type LocalTrainingExperiment,
  type LocalTrainingExperimentStatus,
  type LocalTrainingPlan,
  nextLocalTrainingId,
} from "./localTrainingTypes";

const STORE = new Map<string, LocalTrainingExperiment>();

export function createExperimentFromPlan(plan: LocalTrainingPlan): LocalTrainingExperiment {
  const now = new Date().toISOString();
  const exp: LocalTrainingExperiment = {
    id: nextLocalTrainingId("LTE"),
    planId: plan.id,
    status: "READY_TO_RUN",
    datasetVersionId: plan.datasetVersionId,
    createdAt: now,
    updatedAt: now,
  };
  STORE.set(exp.id, exp);
  return exp;
}

export function updateExperiment(
  id: string,
  patch: Partial<Pick<LocalTrainingExperiment, "status" | "outputArtifactPath" | "userNotes" | "evalSummary">>,
): LocalTrainingExperiment | undefined {
  const cur = STORE.get(id);
  if (!cur) return undefined;
  const next: LocalTrainingExperiment = {
    ...cur,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  STORE.set(id, next);
  return next;
}

export function setExperimentStatus(
  id: string,
  status: LocalTrainingExperimentStatus,
): LocalTrainingExperiment | undefined {
  return updateExperiment(id, { status });
}

export function listExperiments(): LocalTrainingExperiment[] {
  return Array.from(STORE.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listExperimentsByPlan(planId: string): LocalTrainingExperiment[] {
  return listExperiments().filter((e) => e.planId === planId);
}

export function countExperiments(): number {
  return STORE.size;
}
