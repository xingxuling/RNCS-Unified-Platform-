// AetherSeed Auto Training Executor · Record Center 桥（轻量内存记录）
export type AutoTrainingRecordType =
  | "AUTO_TRAINING_TASK_CREATED"
  | "AUTO_TRAINING_DRY_RUN_COMPLETED"
  | "AUTO_TRAINING_WAITING_CONFIRMATION"
  | "AUTO_TRAINING_STARTED"
  | "AUTO_TRAINING_COMPLETED"
  | "AUTO_TRAINING_FAILED"
  | "AUTO_TRAINING_BLOCKED";

export interface AutoTrainingRecord {
  id: string;
  type: AutoTrainingRecordType;
  taskId?: string;
  runId?: string;
  at: string;
  note?: string;
}

const RECORDS: AutoTrainingRecord[] = [];
let __rid = 0;

export function recordAutoTrainingEvent(type: AutoTrainingRecordType, opts?: { taskId?: string; runId?: string; note?: string }) {
  __rid += 1;
  const ev: AutoTrainingRecord = {
    id: `ATR-${Date.now().toString(36)}-${__rid.toString(36)}`,
    type,
    taskId: opts?.taskId,
    runId: opts?.runId,
    at: new Date().toISOString(),
    note: opts?.note,
  };
  RECORDS.unshift(ev);
  return ev;
}

export function listAutoTrainingRecords(limit = 50): AutoTrainingRecord[] {
  return RECORDS.slice(0, limit);
}
