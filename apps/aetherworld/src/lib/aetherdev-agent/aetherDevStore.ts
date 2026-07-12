// AetherDev · 运行记录持久化（localStorage + 订阅）
import type { DevAgentRun } from "./aetherDevTypes";

const KEY = "aetherworld.aetherdev-agent.runs.v1";
const MAX_RUNS = 50;
const listeners = new Set<() => void>();

function load(): DevAgentRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DevAgentRun[]) : [];
  } catch {
    return [];
  }
}

function save(arr: DevAgentRun[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX_RUNS)));
  } catch {
    /* ignore quota */
  }
  for (const l of listeners) {
    try { l(); } catch { /* noop */ }
  }
}

export function listDevRuns(): DevAgentRun[] {
  return load().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDevRun(id: string): DevAgentRun | undefined {
  return load().find((r) => r.id === id);
}

export function saveDevRun(run: DevAgentRun): DevAgentRun {
  const arr = load();
  const idx = arr.findIndex((r) => r.id === run.id);
  const next: DevAgentRun = { ...run, updatedAt: new Date().toISOString() };
  if (idx >= 0) arr[idx] = next;
  else arr.unshift(next);
  save(arr);
  return next;
}

export function subscribeDevRuns(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function newDevId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
