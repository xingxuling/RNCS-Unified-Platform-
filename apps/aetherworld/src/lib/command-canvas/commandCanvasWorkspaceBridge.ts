import type { CommandRouteResult } from "./commandRouter";

export interface CanvasWorkspaceRecord {
  recordId: string;
  commandId: string;
  intentType: string;
  rawCommand: string;
  createdAt: string;
}

const RECORDS: CanvasWorkspaceRecord[] = [];

export function saveCommandToWorkspace(cmd: CommandRouteResult): string {
  const recordId = `CCW-${Date.now().toString(36)}-${RECORDS.length + 1}`;
  RECORDS.unshift({
    recordId,
    commandId: cmd.commandId,
    intentType: cmd.intentType,
    rawCommand: cmd.rawCommand,
    createdAt: cmd.createdAt,
  });
  if (RECORDS.length > 200) RECORDS.length = 200;
  return recordId;
}

export function listCanvasWorkspaceRecords(): CanvasWorkspaceRecord[] { return RECORDS.slice(); }
