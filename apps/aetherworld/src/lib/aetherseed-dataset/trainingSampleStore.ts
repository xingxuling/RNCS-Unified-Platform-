// AetherSeed Dataset · 训练样本存储（内存版 v0.1）
import type { TrainingSample } from "./datasetTypes";

const STORE = new Map<string, TrainingSample>();

export function putTrainingSample(s: TrainingSample): void {
  STORE.set(s.id, s);
}

export function putTrainingSamples(list: TrainingSample[]): void {
  for (const s of list) STORE.set(s.id, s);
}

export function getTrainingSample(id: string): TrainingSample | undefined {
  return STORE.get(id);
}

export function listTrainingSamples(): TrainingSample[] {
  return Array.from(STORE.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getTrainingSamplesByIds(ids: string[]): TrainingSample[] {
  return ids.map((id) => STORE.get(id)).filter((x): x is TrainingSample => Boolean(x));
}

export function countTrainingSamples(): number {
  return STORE.size;
}

export function clearTrainingSamples(): void {
  STORE.clear();
}
