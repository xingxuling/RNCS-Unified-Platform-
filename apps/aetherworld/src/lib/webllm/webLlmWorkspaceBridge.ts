import type { WebLlmRunRequest, WebLlmRunResult } from "./webLlmChatEngine";

export interface WorkspaceWebLlmRunRecord {
  recordId: string;
  runId: string;
  modelId: string;
  taskType: string;
  runtimeMode: string;
  neuroControlProfile: string;
  status: string;
  fallbackUsed: boolean;
  qaStatus: string;
  createdAt: string;
}

const KEY = "aether.webllm.workspace.v1";

function readAll(): WorkspaceWebLlmRunRecord[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function writeAll(list: WorkspaceWebLlmRunRecord[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200))); } catch {}
}

export function saveWebLlmRunToWorkspace(req: WebLlmRunRequest, result: WebLlmRunResult, neuroControlProfile: string, qaStatus: string): WorkspaceWebLlmRunRecord {
  const rec: WorkspaceWebLlmRunRecord = {
    recordId: `wllm-rec-${Date.now().toString(36)}`,
    runId: result.runId,
    modelId: result.modelId,
    taskType: result.taskType,
    runtimeMode: req.runtimeMode,
    neuroControlProfile,
    status: result.status,
    fallbackUsed: result.fallbackUsed,
    qaStatus,
    createdAt: result.createdAt,
  };
  const list = readAll();
  list.unshift(rec);
  writeAll(list);
  return rec;
}

export function listWebLlmWorkspaceRecords(): WorkspaceWebLlmRunRecord[] {
  return readAll();
}

export function clearWebLlmWorkspace() {
  writeAll([]);
}
