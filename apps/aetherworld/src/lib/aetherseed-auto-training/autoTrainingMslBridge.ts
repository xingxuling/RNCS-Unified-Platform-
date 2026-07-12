// AetherSeed Auto Training Executor · MSL 桥
import type { AutoTrainingTask } from "./autoTrainingTypes";

export function buildAutoTrainingMslFrame(task: AutoTrainingTask): string {
  return [
    "MSL::AETHERSEED_AUTO_TRAINING",
    `@taskId=${task.id}`,
    `@status=${task.status}`,
    `@level=${task.level}`,
    `@safety=${task.safetyStatus}`,
    `@confirmation=${task.status === "WAITING_CONFIRMATION" ? "REQUIRED" : task.status === "READY_TO_RUN" ? "CONFIRMED" : "N/A"}`,
    `@source=${task.source}`,
  ].join("\n");
}
