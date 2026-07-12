// 材料工厂自动入库 · 长语料切片存储（内存版 v0.1）
import type { LongCorpusChunk } from "@/lib/intake-forge/intakeAbsorptionTypes";

const STORE = new Map<string, LongCorpusChunk>();

export function putLongCorpusChunks(list: LongCorpusChunk[]): void {
  for (const c of list) STORE.set(c.id, c);
}

export function listLongCorpusChunks(): LongCorpusChunk[] {
  return Array.from(STORE.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listLongCorpusByRun(runId: string): LongCorpusChunk[] {
  return listLongCorpusChunks().filter((c) => c.intakeRunId === runId);
}

export function countLongCorpusChunks(): number {
  return STORE.size;
}

export function sumLongCorpusTokens(): number {
  let sum = 0;
  for (const c of STORE.values()) sum += c.tokenEstimate;
  return sum;
}

export function clearLongCorpus(): void {
  STORE.clear();
}
