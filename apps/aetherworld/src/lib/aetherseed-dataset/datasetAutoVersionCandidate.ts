// AetherSeed Intake Auto Dataset Sink · 自动版本候选存储（内存版 v0.1）
import type { AutoDatasetVersionCandidate } from "./intakeAutoDatasetSinkTypes";

const STORE = new Map<string, AutoDatasetVersionCandidate>();

export function putAutoCandidate(c: AutoDatasetVersionCandidate): void {
  STORE.set(c.id, c);
}

export function getAutoCandidate(id: string): AutoDatasetVersionCandidate | undefined {
  return STORE.get(id);
}

export function listAutoCandidates(): AutoDatasetVersionCandidate[] {
  return Array.from(STORE.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listExportReadyCandidates(): AutoDatasetVersionCandidate[] {
  return listAutoCandidates().filter((c) => c.readyForExport);
}

export function latestAutoCandidate(): AutoDatasetVersionCandidate | undefined {
  return listAutoCandidates()[0];
}

export function countAutoCandidates(): number {
  return STORE.size;
}

export function clearAutoCandidates(): void {
  STORE.clear();
}
