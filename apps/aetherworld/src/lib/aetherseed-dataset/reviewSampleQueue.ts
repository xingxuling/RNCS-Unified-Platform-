// AetherSeed Intake Auto Dataset Sink · 待复核队列（内存版 v0.1）
import type { ReviewSampleItem } from "./intakeAutoDatasetSinkTypes";

const STORE = new Map<string, ReviewSampleItem>();

export function pushReviewSample(s: ReviewSampleItem): void {
  STORE.set(s.id, s);
}

export function pushReviewSamples(list: ReviewSampleItem[]): void {
  for (const s of list) STORE.set(s.id, s);
}

export function listReviewSamples(): ReviewSampleItem[] {
  return Array.from(STORE.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listReviewSamplesByRun(runId: string): ReviewSampleItem[] {
  return listReviewSamples().filter((s) => s.sourceRunId === runId);
}

export function countReviewSamples(): number {
  return STORE.size;
}

export function clearReviewSamples(): void {
  STORE.clear();
}
