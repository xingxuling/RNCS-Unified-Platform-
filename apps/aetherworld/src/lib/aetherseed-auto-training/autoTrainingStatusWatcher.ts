// AetherSeed Auto Training Executor · 状态观察器
import { getRun, saveRun } from "./autoTrainingTaskStore";
import { appendLog } from "./autoTrainingLogStore";
import type { AutoTrainingRunStatus } from "./autoTrainingTypes";

export function markRunStatus(runId: string, status: AutoTrainingRunStatus, opts?: { exitCode?: number; note?: string }) {
  const run = getRun(runId);
  if (!run) return undefined;
  const now = new Date().toISOString();
  const updated = {
    ...run,
    status,
    completedAt: ["COMPLETED", "FAILED", "CANCELLED", "TIMEOUT"].includes(status) ? now : run.completedAt,
    exitCode: opts?.exitCode ?? run.exitCode,
  };
  saveRun(updated);
  if (opts?.note) appendLog(runId, "system", `[${status}] ${opts.note}`);
  return updated;
}
