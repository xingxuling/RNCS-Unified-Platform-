// 实验日志（草案级，不落库）：仅在内存维护一份"草案实验" → 状态变化记录
import type {
  ForgeExperiment,
  ForgeExperimentStatus,
} from "./personalModelForgeTypes";

interface ExperimentLogEntry {
  experimentId: string;
  at: string;
  fromStatus?: ForgeExperimentStatus;
  toStatus: ForgeExperimentStatus;
  note?: string;
}

const LOG: ExperimentLogEntry[] = [];

export function logExperimentStatus(
  e: ForgeExperiment,
  to: ForgeExperimentStatus,
  note?: string,
): void {
  LOG.push({
    experimentId: e.id,
    at: new Date().toISOString(),
    fromStatus: e.status,
    toStatus: to,
    note,
  });
  e.status = to;
}

export function listExperimentLog(): ExperimentLogEntry[] {
  return [...LOG];
}

export function clearExperimentLog(): void {
  LOG.length = 0;
}
