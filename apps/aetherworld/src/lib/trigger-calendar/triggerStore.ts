import type { TriggerItem, TriggerStatus } from "./triggerTypes";

const STORAGE_KEY = "aether.trigger-calendar.items.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readAll(): TriggerItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TriggerItem[];
  } catch {
    return [];
  }
}

function writeAll(items: TriggerItem[]) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("aether:trigger-calendar:changed"));
  } catch {
    // ignore
  }
}

export function listTriggers(): TriggerItem[] {
  return readAll().sort((a, b) => {
    const ka = `${a.date} ${a.time ?? "23:59"}`;
    const kb = `${b.date} ${b.time ?? "23:59"}`;
    return ka.localeCompare(kb);
  });
}

export function getTrigger(triggerId: string): TriggerItem | undefined {
  return readAll().find((t) => t.triggerId === triggerId);
}

export function newTriggerId(): string {
  return `TRG-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function upsertTrigger(item: TriggerItem) {
  const all = readAll();
  const idx = all.findIndex((t) => t.triggerId === item.triggerId);
  const next = { ...item, updatedAt: new Date().toISOString() };
  if (idx >= 0) all[idx] = next;
  else all.push(next);
  writeAll(all);
}

export function deleteTrigger(triggerId: string) {
  writeAll(readAll().filter((t) => t.triggerId !== triggerId));
}

export function setStatus(triggerId: string, status: TriggerStatus, patch?: Partial<TriggerItem>) {
  const t = getTrigger(triggerId);
  if (!t) return;
  upsertTrigger({
    ...t,
    ...patch,
    status,
    completedAt: status === "DONE" ? new Date().toISOString() : t.completedAt,
  });
}

export function subscribe(listener: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => listener();
  window.addEventListener("aether:trigger-calendar:changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("aether:trigger-calendar:changed", handler);
    window.removeEventListener("storage", handler);
  };
}
