// 材料工厂自动入库 · Full Corpus 数据集候选存储（内存版 v0.1）
import type { FullCorpusCandidate } from "./materialAutoSinkTypes";

const STORE = new Map<string, FullCorpusCandidate>();

export function putFullCorpusCandidate(c: FullCorpusCandidate): void {
  STORE.set(c.id, c);
}

export function listFullCorpusCandidates(): FullCorpusCandidate[] {
  return Array.from(STORE.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getFullCorpusCandidate(id: string): FullCorpusCandidate | undefined {
  return STORE.get(id);
}

export function latestFullCorpusCandidate(): FullCorpusCandidate | undefined {
  return listFullCorpusCandidates()[0];
}

export function countFullCorpusCandidates(): number {
  return STORE.size;
}
