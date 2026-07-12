// Aetherworld Autonomous Factory OS · 任务存储（localStorage 持久化）
import type { AutonomousFactoryTask, FactoryTaskStatus } from "./autonomousFactoryTypes";

const KEY = "aetherworld.autonomous-factory.tasks.v1";
const listeners = new Set<() => void>();

function load(): AutonomousFactoryTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AutonomousFactoryTask[]) : [];
  } catch {
    return [];
  }
}
function save(arr: AutonomousFactoryTask[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
  for (const l of listeners) l();
}

export function subscribeFactoryTasks(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function listFactoryTasks(): AutonomousFactoryTask[] {
  return load().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveFactoryTask(t: AutonomousFactoryTask): AutonomousFactoryTask {
  const arr = load();
  const idx = arr.findIndex((x) => x.id === t.id);
  const next = { ...t, updatedAt: new Date().toISOString() };
  if (idx >= 0) arr[idx] = next;
  else arr.unshift(next);
  save(arr);
  return next;
}

export function patchFactoryTask(
  id: string,
  patch: Partial<AutonomousFactoryTask>,
): AutonomousFactoryTask | undefined {
  const arr = load();
  const idx = arr.findIndex((x) => x.id === id);
  if (idx < 0) return undefined;
  arr[idx] = { ...arr[idx], ...patch, updatedAt: new Date().toISOString() };
  save(arr);
  return arr[idx];
}

export function setFactoryTaskStatus(
  id: string,
  status: FactoryTaskStatus,
  notes?: string,
): AutonomousFactoryTask | undefined {
  const t = load().find((x) => x.id === id);
  if (!t) return undefined;
  const merged = notes ? [...t.notes, notes] : t.notes;
  return patchFactoryTask(id, { status, notes: merged });
}

export function deleteFactoryTask(id: string): void {
  save(load().filter((x) => x.id !== id));
}
