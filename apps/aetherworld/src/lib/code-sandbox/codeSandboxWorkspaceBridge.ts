import type { CodeRunResult } from "./codeRunRequestEngine";

export interface WorkspaceCodeRunRecord {
  recordId: string;
  runId: string;
  projectId: string;
  runnerMode: string;
  status: string;
  errorCount: number;
  patchCount: number;
  qaStatus: string;
  createdAt: string;
}

const STORE_KEY = "aether.code-sandbox.workspace.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}
function read(): WorkspaceCodeRunRecord[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { return []; }
}
function write(list: WorkspaceCodeRunRecord[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, 100)));
}

export function saveCodeRunToWorkspace(result: CodeRunResult): WorkspaceCodeRunRecord {
  const record: WorkspaceCodeRunRecord = {
    recordId: `ws-${result.runId}`,
    runId: result.runId,
    projectId: result.projectId,
    runnerMode: result.runnerMode,
    status: result.status,
    errorCount: result.errorSummary ? 1 : 0,
    patchCount: result.patchDrafts.length,
    qaStatus: result.qaResult?.status || "UNKNOWN",
    createdAt: new Date().toISOString(),
  };
  const list = read();
  list.unshift(record);
  write(list);
  return record;
}

export function listCodeRunRecords(): WorkspaceCodeRunRecord[] {
  return read();
}

export function getCodeRunRecord(runId: string): WorkspaceCodeRunRecord | undefined {
  return read().find((r) => r.runId === runId);
}

const RESULT_STORE_KEY = "aether.code-sandbox.results.v1";
function readResults(): CodeRunResult[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(RESULT_STORE_KEY) || "[]"); } catch { return []; }
}
function writeResults(list: CodeRunResult[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(RESULT_STORE_KEY, JSON.stringify(list.slice(0, 30)));
}

export function persistCodeRunResult(result: CodeRunResult): void {
  const list = readResults().filter((r) => r.runId !== result.runId);
  list.unshift(result);
  writeResults(list);
}

export function getCodeRunResult(runId: string): CodeRunResult | undefined {
  return readResults().find((r) => r.runId === runId);
}

export function listCodeRunResults(): CodeRunResult[] {
  return readResults();
}
