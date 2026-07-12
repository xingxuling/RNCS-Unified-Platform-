import type { WebCapabilityRun } from "./aetherWebCapabilityModels";

export interface WorkspaceWebCapabilityRunRecord {
  recordId: string;
  capabilityId: string;
  userTask: string;
  outputCount: number;
  qaStatus: string;
  createdAt: string;
}

const RECORDS: WorkspaceWebCapabilityRunRecord[] = [];

export function saveCapabilityRunToWorkspace(run: WebCapabilityRun): string {
  const recordId = `WCR-${Date.now().toString(36)}-${RECORDS.length + 1}`;
  RECORDS.unshift({
    recordId,
    capabilityId: run.capabilityId,
    userTask: run.userTask,
    outputCount: run.outputs.length,
    qaStatus: run.qaStatus,
    createdAt: run.createdAt,
  });
  if (RECORDS.length > 200) RECORDS.length = 200;
  return recordId;
}

export function listCapabilityWorkspaceRecords(): WorkspaceWebCapabilityRunRecord[] {
  return RECORDS.slice();
}

export function getWorkspaceCounters() {
  return {
    totalRecords: RECORDS.length,
    latest: RECORDS[0],
  };
}
