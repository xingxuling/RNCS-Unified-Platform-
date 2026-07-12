// AetherSeed Experiment Ledger · 实验结果登记器
// 高层 API：标记开始 / 完成 / 失败 / 登记指标 / 登记 checkpoint。
import {
  type AetherSeedExperiment,
  type ExperimentMetrics,
  nextExperimentId,
} from "./experimentLedgerTypes";
import {
  patchExperiment,
  saveMetrics,
} from "./experimentLedgerStore";
import { parseMetricsFromLog, type ParsedMetricsDraft } from "./experimentMetricParser";

export function markExperimentStarted(exp: AetherSeedExperiment): AetherSeedExperiment | undefined {
  return patchExperiment(exp.id, {
    status: "RUNNING_MANUAL",
    startedAt: new Date().toISOString(),
  });
}

export function markExperimentCompleted(
  exp: AetherSeedExperiment,
  notes?: string,
): AetherSeedExperiment | undefined {
  return patchExperiment(exp.id, {
    status: "COMPLETED_MANUAL",
    completedAt: new Date().toISOString(),
    notes,
  });
}

export function markExperimentFailed(
  exp: AetherSeedExperiment,
  notes?: string,
): AetherSeedExperiment | undefined {
  return patchExperiment(exp.id, {
    status: "FAILED_MANUAL",
    completedAt: new Date().toISOString(),
    notes,
  });
}

export function markExperimentEvaluated(
  exp: AetherSeedExperiment,
): AetherSeedExperiment | undefined {
  return patchExperiment(exp.id, { status: "EVALUATED" });
}

export interface RecordMetricsInput {
  experimentId: string;
  notes?: string;
  /** 直接传入指标字段；缺省时尝试从 logText 解析 */
  fields?: ParsedMetricsDraft;
  /** 用户粘贴的日志摘要 */
  logText?: string;
}

export function recordMetrics(input: RecordMetricsInput): ExperimentMetrics {
  const parsed = input.logText ? parseMetricsFromLog(input.logText) : {};
  const fields = { ...parsed, ...input.fields };
  const metrics: ExperimentMetrics = {
    id: nextExperimentId("EM"),
    experimentId: input.experimentId,
    ...fields,
    notes: (input.notes ?? input.logText ?? "").trim().slice(0, 1200),
    createdAt: new Date().toISOString(),
  };
  return saveMetrics(metrics);
}
