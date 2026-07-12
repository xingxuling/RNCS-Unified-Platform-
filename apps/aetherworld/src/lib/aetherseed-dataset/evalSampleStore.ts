// AetherSeed Dataset · 评测样本存储（内存版 v0.1）
import type { EvalSample } from "./datasetTypes";

const STORE = new Map<string, EvalSample>();

export function putEvalSample(s: EvalSample): void {
  STORE.set(s.id, s);
}

export function putEvalSamples(list: EvalSample[]): void {
  for (const s of list) STORE.set(s.id, s);
}

export function getEvalSample(id: string): EvalSample | undefined {
  return STORE.get(id);
}

export function listEvalSamples(): EvalSample[] {
  return Array.from(STORE.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getEvalSamplesByIds(ids: string[]): EvalSample[] {
  return ids.map((id) => STORE.get(id)).filter((x): x is EvalSample => Boolean(x));
}

export function countEvalSamples(): number {
  return STORE.size;
}

export function removeEvalSamples(ids: string[]): number {
  let n = 0;
  for (const id of ids) {
    if (STORE.delete(id)) n += 1;
  }
  return n;
}

/** 按目标评测占比裁剪评测集（移除最旧的若干条），返回被移除的条数。 */
export function trimEvalSamplesToCount(targetCount: number): number {
  if (targetCount < 0) return 0;
  const all = listEvalSamples(); // 已按 createdAt desc
  if (all.length <= targetCount) return 0;
  const toRemove = all.slice(targetCount); // 多出来的（较旧的）
  return removeEvalSamples(toRemove.map((s) => s.id));
}

export function clearEvalSamples(): void {
  STORE.clear();
}
