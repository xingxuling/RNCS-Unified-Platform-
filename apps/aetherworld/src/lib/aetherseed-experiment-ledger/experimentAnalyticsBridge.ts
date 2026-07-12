// AetherSeed Experiment Ledger · Analytics 桥
import {
  EXPERIMENT_STATUS_LABEL,
  FAILURE_TYPE_LABEL,
  NEXT_RECOMMENDATION_LABEL,
  type ExperimentStatus,
  type FailureType,
  type NextRecommendationType,
} from "./experimentLedgerTypes";
import {
  listAllMetrics,
  listBloodlines,
  listCheckpoints,
  listExperiments,
  listFailures,
  listNextPlans,
} from "./experimentLedgerStore";

export interface ExperimentLedgerAnalytics {
  totalExperiments: number;
  successRate: number;
  failureTypeDistribution: { type: FailureType; label: string; count: number }[];
  statusDistribution: { status: ExperimentStatus; label: string; count: number }[];
  avgTrainLoss?: number;
  avgEvalLoss?: number;
  perTargetCount: { target: string; count: number }[];
  checkpointCount: number;
  nextPlanDistribution: { type: NextRecommendationType; label: string; count: number }[];
  bloodlineCount: number;
}

function avg(nums: number[]): number | undefined {
  const filtered = nums.filter((n) => typeof n === "number" && Number.isFinite(n));
  if (!filtered.length) return undefined;
  return Number((filtered.reduce((a, b) => a + b, 0) / filtered.length).toFixed(3));
}

export function buildExperimentLedgerAnalytics(): ExperimentLedgerAnalytics {
  const exps = listExperiments();
  const metrics = listAllMetrics();
  const failures = listFailures();
  const nextPlans = listNextPlans();
  const completed = exps.filter((e) => e.status === "COMPLETED_MANUAL" || e.status === "EVALUATED").length;
  const failed = exps.filter((e) => e.status === "FAILED_MANUAL").length;
  const finished = completed + failed;
  const successRate = finished === 0 ? 0 : Number((completed / finished).toFixed(3));

  const statusMap = new Map<ExperimentStatus, number>();
  for (const e of exps) statusMap.set(e.status, (statusMap.get(e.status) ?? 0) + 1);

  const failMap = new Map<FailureType, number>();
  for (const f of failures) failMap.set(f.failureType, (failMap.get(f.failureType) ?? 0) + 1);

  const targetMap = new Map<string, number>();
  for (const e of exps) targetMap.set(e.targetModel, (targetMap.get(e.targetModel) ?? 0) + 1);

  const nextMap = new Map<NextRecommendationType, number>();
  for (const p of nextPlans) nextMap.set(p.recommendationType, (nextMap.get(p.recommendationType) ?? 0) + 1);

  return {
    totalExperiments: exps.length,
    successRate,
    statusDistribution: Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      label: EXPERIMENT_STATUS_LABEL[status],
      count,
    })),
    failureTypeDistribution: Array.from(failMap.entries()).map(([type, count]) => ({
      type,
      label: FAILURE_TYPE_LABEL[type],
      count,
    })),
    avgTrainLoss: avg(metrics.map((m) => m.trainLoss ?? NaN)),
    avgEvalLoss: avg(metrics.map((m) => m.evalLoss ?? NaN)),
    perTargetCount: Array.from(targetMap.entries()).map(([target, count]) => ({ target, count })),
    checkpointCount: listCheckpoints().length,
    nextPlanDistribution: Array.from(nextMap.entries()).map(([type, count]) => ({
      type,
      label: NEXT_RECOMMENDATION_LABEL[type],
      count,
    })),
    bloodlineCount: listBloodlines().length,
  };
}
