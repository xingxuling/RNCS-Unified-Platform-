// AetherSeed Local Training · MSL 帧桥
import type { LocalTrainingExperiment, LocalTrainingPlan } from "./localTrainingTypes";

export function buildLocalTrainingMslFrames(
  plan: LocalTrainingPlan,
  experiment?: LocalTrainingExperiment,
) {
  const frames: { type: string; payload: Record<string, unknown> }[] = [];
  frames.push({
    type: "LOCAL_TRAINING.PLAN_CREATED",
    payload: {
      planId: plan.id,
      target: plan.targetModel,
      mode: plan.trainingMode,
      safety: plan.safetyStatus,
    },
  });
  if (experiment) {
    frames.push({
      type: `LOCAL_TRAINING.EXPERIMENT_${experiment.status}`,
      payload: {
        planId: plan.id,
        experimentId: experiment.id,
        status: experiment.status,
      },
    });
  }
  return frames;
}
