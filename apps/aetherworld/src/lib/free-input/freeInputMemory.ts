import type { NormalizedFreeInput } from "./freeInputNormalizer";
import type { FreeTaskPlan } from "./freeTaskSplitter";

export interface FreeInputMemoryEntry {
  id: string;
  createdAt: string;
  rawInput: string;
  normalizedInput: NormalizedFreeInput;
  taskPlan: FreeTaskPlan;
  answerSummary: string;
  subjectMode: string;
  language: string;
}

const KEY_PREFIX = "aether.freeInput.memory";
const KEY_ENABLED = "aether.freeInput.memory.enabled";
const MAX_ENTRIES = 50;

function key(subjectMode: string) {
  return `${KEY_PREFIX}.${subjectMode === "DEMO" ? "demo" : "real"}`;
}

function read(k: string): FreeInputMemoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as FreeInputMemoryEntry[]) : [];
  } catch { return []; }
}

function write(k: string, list: FreeInputMemoryEntry[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(k, JSON.stringify(list.slice(0, MAX_ENTRIES))); } catch { /* ignore */ }
}

export function isFreeInputMemoryEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEY_ENABLED) !== "false";
}

export function setFreeInputMemoryEnabled(v: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_ENABLED, v ? "true" : "false");
}

export function listFreeInputMemory(subjectMode: string): FreeInputMemoryEntry[] {
  return read(key(subjectMode));
}

export function appendFreeInputMemory(entry: FreeInputMemoryEntry) {
  if (!isFreeInputMemoryEnabled()) return;
  const k = key(entry.subjectMode);
  write(k, [entry, ...read(k)]);
}

export function clearFreeInputMemory(subjectMode: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(subjectMode));
}
