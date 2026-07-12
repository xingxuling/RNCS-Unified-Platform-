// 材料工厂自动入库 · 原始语料存储（内存版 v0.1）
import type { RawCorpusDocument } from "@/lib/intake-forge/intakeAbsorptionTypes";

const STORE = new Map<string, RawCorpusDocument>();

export function putRawCorpusDocuments(list: RawCorpusDocument[]): void {
  for (const d of list) STORE.set(d.id, d);
}

export function listRawCorpusDocuments(): RawCorpusDocument[] {
  return Array.from(STORE.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listRawCorpusByRun(runId: string): RawCorpusDocument[] {
  return listRawCorpusDocuments().filter((d) => d.intakeRunId === runId);
}

export function countRawCorpusDocuments(): number {
  return STORE.size;
}

export function sumRawCorpusTokens(): number {
  let sum = 0;
  for (const d of STORE.values()) sum += d.rawTokenEstimate;
  return sum;
}

export function clearRawCorpus(): void {
  STORE.clear();
}
