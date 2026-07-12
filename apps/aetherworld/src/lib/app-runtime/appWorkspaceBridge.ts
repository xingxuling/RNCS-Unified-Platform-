import type { AppProjectObject } from "./appProjectObjectEngine";

export interface WorkspaceAppProjectRecord {
  recordId: string;
  projectId: string;
  projectName: string;
  appType: string;
  summary: string;
  fileCount: number;
  status: string;
  qaStatus: string;
  exportTargets: string[];
  createdAt: string;
}

const STORE_KEY = "aether.app-runtime.workspace.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function read(): WorkspaceAppProjectRecord[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { return []; }
}

function write(list: WorkspaceAppProjectRecord[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, 50)));
}

export function saveAppProjectToWorkspace(project: AppProjectObject): WorkspaceAppProjectRecord {
  const record: WorkspaceAppProjectRecord = {
    recordId: `ws-${project.projectId}`,
    projectId: project.projectId,
    projectName: project.projectName,
    appType: project.appType,
    summary: project.intentSummary,
    fileCount: project.codeFiles.length,
    status: project.status,
    qaStatus: project.qaResult?.status || "UNKNOWN",
    exportTargets: project.exportPackages.map(p => p.exportTarget),
    createdAt: new Date().toISOString(),
  };
  const list = read().filter(r => r.projectId !== project.projectId);
  list.unshift(record);
  write(list);
  return record;
}

export function listAppWorkspaceRecords(): WorkspaceAppProjectRecord[] {
  return read();
}

export function getAppWorkspaceRecord(projectId: string): WorkspaceAppProjectRecord | undefined {
  return read().find(r => r.projectId === projectId);
}
