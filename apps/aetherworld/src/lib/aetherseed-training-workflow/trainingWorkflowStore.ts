// 训练工作流存储 v0.1（仅内存 + 可选 localStorage，避免 SSR 触碰 window）
import type { TrainingWorkflow } from "./trainingWorkflowTypes";

const STORAGE_KEY = "aetherseed.training-workflow.v0_1";

let _cache: TrainingWorkflow[] | null = null;

function loadFromStorage(): TrainingWorkflow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(list: TrainingWorkflow[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota */
  }
}

function ensureCache(): TrainingWorkflow[] {
  if (_cache === null) _cache = loadFromStorage();
  return _cache;
}

export function listWorkflows(): TrainingWorkflow[] {
  return [...ensureCache()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getWorkflow(id: string): TrainingWorkflow | null {
  return ensureCache().find((w) => w.id === id) ?? null;
}

export function upsertWorkflow(wf: TrainingWorkflow): TrainingWorkflow {
  const list = ensureCache();
  const idx = list.findIndex((w) => w.id === wf.id);
  if (idx >= 0) list[idx] = wf;
  else list.push(wf);
  persist(list);
  return wf;
}

export function deleteWorkflow(id: string): void {
  const list = ensureCache().filter((w) => w.id !== id);
  _cache = list;
  persist(list);
}

export function resetWorkflowsForTest(): void {
  _cache = [];
  persist([]);
}
