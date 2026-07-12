// AetherSeed Unattended Training Factory · 任务存储（前端内存版，localStorage 持久化）
import type { UnattendedTrainingRun, FailureRecoveryPlan } from "./unattendedTypes";

const STORAGE_KEY = "aetherseed.unattended.runs.v1";
const PLAN_KEY = "aetherseed.unattended.recovery.v1";

const listeners = new Set<() => void>();

function loadAll(): UnattendedTrainingRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UnattendedTrainingRun[]) : [];
  } catch {
    return [];
  }
}

function saveAll(runs: UnattendedTrainingRun[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  } catch {
    /* ignore */
  }
}

function loadPlans(): Record<string, FailureRecoveryPlan> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PLAN_KEY);
    return raw ? (JSON.parse(raw) as Record<string, FailureRecoveryPlan>) : {};
  } catch {
    return {};
  }
}

function savePlans(plans: Record<string, FailureRecoveryPlan>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLAN_KEY, JSON.stringify(plans));
  } catch {
    /* ignore */
  }
}

export function subscribeUnattended(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(): void {
  for (const l of listeners) l();
}

export function listRuns(): UnattendedTrainingRun[] {
  return loadAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getRun(id: string): UnattendedTrainingRun | undefined {
  return loadAll().find((r) => r.id === id);
}

export function saveRun(run: UnattendedTrainingRun): UnattendedTrainingRun {
  const arr = loadAll();
  const idx = arr.findIndex((r) => r.id === run.id);
  const next = { ...run, updatedAt: new Date().toISOString() };
  if (idx >= 0) arr[idx] = next;
  else arr.unshift(next);
  saveAll(arr);
  notify();
  return next;
}

export function patchRun(id: string, patch: Partial<UnattendedTrainingRun>): UnattendedTrainingRun | undefined {
  const run = getRun(id);
  if (!run) return undefined;
  return saveRun({ ...run, ...patch });
}

export function deleteRun(id: string): void {
  saveAll(loadAll().filter((r) => r.id !== id));
  notify();
}

export function saveRecoveryPlan(plan: FailureRecoveryPlan): FailureRecoveryPlan {
  const plans = loadPlans();
  plans[plan.runId] = plan;
  savePlans(plans);
  notify();
  return plan;
}

export function getRecoveryPlan(runId: string): FailureRecoveryPlan | undefined {
  return loadPlans()[runId];
}
