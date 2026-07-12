// 把真实 WebLLM 运行结果写入 Workspace（localStorage）
const KEY = "aether.realWebLlm.runs";

export interface WorkspaceRealWebLlmRunRecord {
  recordId: string;
  runId: string;
  sourceModule: string;
  modelId: string;
  taskType: string;
  status: string;
  textPreview: string;
  qaStatus: string;
  createdAt: string;
}

function read(): WorkspaceRealWebLlmRunRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function write(list: WorkspaceRealWebLlmRunRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-200)));
  } catch {
    /* quota */
  }
}

export function saveRealWebLlmRun(r: Omit<WorkspaceRealWebLlmRunRecord, "recordId" | "createdAt">) {
  const rec: WorkspaceRealWebLlmRunRecord = {
    ...r,
    recordId: "rwl_" + Math.random().toString(36).slice(2, 10),
    createdAt: new Date().toISOString(),
    textPreview: r.textPreview.slice(0, 240),
  };
  const list = read();
  list.push(rec);
  write(list);
  return rec;
}

export function listRealWebLlmRuns(): WorkspaceRealWebLlmRunRecord[] {
  return read().slice().reverse();
}

export function clearRealWebLlmRuns() {
  write([]);
}
