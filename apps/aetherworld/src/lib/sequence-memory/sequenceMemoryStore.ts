// 数列记忆 LocalStorage 存储
import type { SequenceMemoryUnit } from "./sequenceMemoryTypes";

const KEY = "aether.sequenceMemory.units.v1";
const MAX = 400;
const listeners = new Set<() => void>();

function readAll(): SequenceMemoryUnit[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function writeAll(list: SequenceMemoryUnit[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    listeners.forEach((l) => l());
  } catch {
    /* quota */
  }
}

export function subscribeSequenceMemory(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function listSequenceMemoryUnits(sessionId?: string): SequenceMemoryUnit[] {
  const all = readAll();
  return sessionId ? all.filter((u) => u.chatSessionId === sessionId) : all;
}

export function saveSequenceMemoryUnit(unit: SequenceMemoryUnit): SequenceMemoryUnit {
  const all = readAll();
  const idx = all.findIndex((u) => u.id === unit.id);
  if (idx >= 0) all[idx] = unit;
  else all.unshift(unit);
  writeAll(all);
  return unit;
}

export function bumpReuseCount(id: string) {
  const all = readAll();
  const u = all.find((x) => x.id === id);
  if (!u) return;
  u.reuseCount = (u.reuseCount ?? 0) + 1;
  u.updatedAt = new Date().toISOString();
  writeAll(all);
}

export function clearSequenceMemory(sessionId?: string) {
  const all = readAll();
  const next = sessionId ? all.filter((u) => u.chatSessionId !== sessionId) : [];
  writeAll(next);
}
