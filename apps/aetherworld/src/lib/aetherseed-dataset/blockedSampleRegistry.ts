// AetherSeed Intake Auto Dataset Sink · 阻断样本登记（内存版 v0.1）
import type { BlockedSampleRecord, IndexOnlyRecord } from "./intakeAutoDatasetSinkTypes";

const BLOCKED = new Map<string, BlockedSampleRecord>();
const INDEX_ONLY = new Map<string, IndexOnlyRecord>();

export function recordBlockedSample(r: BlockedSampleRecord): void {
  BLOCKED.set(r.id, r);
}

export function recordBlockedSamples(list: BlockedSampleRecord[]): void {
  for (const r of list) BLOCKED.set(r.id, r);
}

export function listBlockedSamples(): BlockedSampleRecord[] {
  return Array.from(BLOCKED.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function countBlockedSamples(): number {
  return BLOCKED.size;
}

export function recordIndexOnly(r: IndexOnlyRecord): void {
  INDEX_ONLY.set(r.id, r);
}

export function recordIndexOnlyList(list: IndexOnlyRecord[]): void {
  for (const r of list) INDEX_ONLY.set(r.id, r);
}

export function listIndexOnly(): IndexOnlyRecord[] {
  return Array.from(INDEX_ONLY.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function countIndexOnly(): number {
  return INDEX_ONLY.size;
}

export function clearBlockedRegistry(): void {
  BLOCKED.clear();
  INDEX_ONLY.clear();
}
