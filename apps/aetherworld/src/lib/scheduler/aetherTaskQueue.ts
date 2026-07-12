// 轻量内存 + localStorage 任务队列。
// 后续可替换为 Lovable Cloud 持久化。
import type { AetherTask, AetherTaskStatus } from "./aetherSchedulerTypes";

const STORAGE_KEY = "aether.scheduler.tasks.v0_1";
const MAX_TASKS = 500;

type Listener = (tasks: AetherTask[]) => void;
const listeners = new Set<Listener>();

function load(): AetherTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function save(tasks: AetherTask[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.slice(0, MAX_TASKS)));
  } catch {
    // ignore quota
  }
  listeners.forEach((l) => {
    try { l(tasks); } catch { /* noop */ }
  });
}

let _cache: AetherTask[] | null = null;
function getAll(): AetherTask[] {
  if (_cache === null) _cache = load();
  return _cache;
}

export function listTasks(filter?: { status?: AetherTaskStatus }): AetherTask[] {
  const all = getAll();
  if (!filter) return [...all];
  return all.filter((t) => !filter.status || t.status === filter.status);
}

export function getTask(id: string): AetherTask | undefined {
  return getAll().find((t) => t.id === id);
}

export function upsertTask(task: AetherTask) {
  const all = getAll();
  const idx = all.findIndex((t) => t.id === task.id);
  if (idx >= 0) all[idx] = task;
  else all.unshift(task);
  _cache = all;
  save(all);
}

export function removeTask(id: string) {
  const all = getAll().filter((t) => t.id !== id);
  _cache = all;
  save(all);
}

export function subscribeTasks(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function newTaskId(): string {
  return `TASK-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
