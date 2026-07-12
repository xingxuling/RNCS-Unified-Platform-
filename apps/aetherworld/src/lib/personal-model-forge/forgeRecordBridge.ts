// 训练事件 → Record Center 桥（草案级）
export interface ForgeRecordDraft {
  eventType:
    | "FORGE_PLAN_GENERATED"
    | "FORGE_EXPERIMENT_STATUS"
    | "FORGE_REPORT_SAVED";
  at: string;
  payload: Record<string, unknown>;
}

const PENDING: ForgeRecordDraft[] = [];

export function draftForgeRecord(
  eventType: ForgeRecordDraft["eventType"],
  payload: Record<string, unknown>,
): ForgeRecordDraft {
  const r: ForgeRecordDraft = { eventType, at: new Date().toISOString(), payload };
  PENDING.push(r);
  return r;
}

export function listPendingForgeRecords(): ForgeRecordDraft[] {
  return [...PENDING];
}

export function clearPendingForgeRecords(): void {
  PENDING.length = 0;
}
