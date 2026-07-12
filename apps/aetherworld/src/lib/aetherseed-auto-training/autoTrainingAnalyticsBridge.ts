// AetherSeed Auto Training Executor · Analytics 桥
import { buildAutoTrainingSnapshot, listTasks, listRuns, getDryRun } from "./autoTrainingTaskStore";

export interface AutoTrainingAnalytics {
  totalTasks: number;
  dryRunPassRate: number;
  blockedCount: number;
  avgRuntimeMinutes: number;
  failureCount: number;
  checkpointCount: number;
  confirmationCount: number;
}

export function buildAutoTrainingAnalytics(): AutoTrainingAnalytics {
  const snap = buildAutoTrainingSnapshot();
  const tasks = listTasks();
  const runs = listRuns();
  const dryRuns = tasks.map((t) => getDryRun(t.id)).filter(Boolean) as NonNullable<ReturnType<typeof getDryRun>>[];
  const pass = dryRuns.filter((d) => d.canRun).length;
  const durations = runs
    .filter((r) => r.startedAt && r.completedAt)
    .map((r) => (new Date(r.completedAt!).getTime() - new Date(r.startedAt!).getTime()) / 60000);
  const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  return {
    totalTasks: snap.total,
    dryRunPassRate: dryRuns.length ? Math.round((pass / dryRuns.length) * 100) : 0,
    blockedCount: snap.blocked,
    avgRuntimeMinutes: Math.round(avg * 10) / 10,
    failureCount: snap.failed,
    checkpointCount: runs.reduce((n, r) => n + r.checkpointIds.length, 0),
    confirmationCount: snap.readyToRun + snap.running + snap.completed,
  };
}
