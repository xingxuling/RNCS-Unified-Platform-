import type { SequenceAIPlan } from "./sequenceAIEnginePlanner";

export interface SequenceAIMemoryEntry {
  id: string;
  createdAt: string;
  subjectMode: string;
  userInput: string;
  intent: string;
  plan: SequenceAIPlan;
  responseSummary: string;
  generatedAssetIds: string[];
}

const KEY_PREFIX = "aether.sequenceAI.memory";
const MAX_ENTRIES = 50;

function storageKey(subjectMode: string): string {
  return `${KEY_PREFIX}.${subjectMode === "DEMO" ? "demo" : "real"}`;
}

function safeRead(key: string): SequenceAIMemoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function safeWrite(key: string, list: SequenceAIMemoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, MAX_ENTRIES)));
  } catch { /* ignore quota */ }
}

export function listSequenceAIMemory(subjectMode: string): SequenceAIMemoryEntry[] {
  return safeRead(storageKey(subjectMode));
}

export function appendSequenceAIMemory(entry: SequenceAIMemoryEntry): void {
  const key = storageKey(entry.subjectMode);
  const list = safeRead(key);
  safeWrite(key, [entry, ...list]);
}

export function clearSequenceAIMemory(subjectMode: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(subjectMode));
}

export function exportSequenceAIMemory(subjectMode: string, format: "json" | "markdown" = "json"): string {
  const list = listSequenceAIMemory(subjectMode);
  if (format === "json") return JSON.stringify(list, null, 2);
  return list.map((e) =>
    `## ${e.createdAt} · ${e.intent}\n\n- 输入：${e.userInput}\n- 主引擎：${e.plan.primaryEngine}\n- 摘要：${e.responseSummary}\n`,
  ).join("\n---\n\n");
}
