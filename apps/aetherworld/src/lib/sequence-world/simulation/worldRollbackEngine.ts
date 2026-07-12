// World Rollback Engine
import type { WorldSnapshot } from "./worldSnapshotEngine";
import { loadSnapshots } from "./worldSnapshotEngine";

export interface RollbackResult {
  ok: boolean;
  snapshot?: WorldSnapshot;
  warnings: string[];
}

export function rollbackToSnapshot(snapshotId: string, opts?: { isFull60?: boolean; isFounder?: boolean }): RollbackResult {
  const all = loadSnapshots();
  const snap = all.find(s => s.id === snapshotId);
  if (!snap) return { ok: false, warnings: ["快照不存在"] };
  const warnings: string[] = [];
  if (opts?.isFull60) warnings.push("Full60 世界回滚：请确认隐私边界");
  return { ok: true, snapshot: snap, warnings };
}

export function compareById(aId: string, bId: string) {
  const all = loadSnapshots();
  const a = all.find(s => s.id === aId);
  const b = all.find(s => s.id === bId);
  if (!a || !b) return null;
  return { a, b };
}

export function forkWorldFromSnapshot(snapshotId: string, opts?: { isFounder?: boolean }) {
  if (!opts?.isFounder) return { ok: false, warnings: ["Fork 仅限 Founder Mode"] };
  const all = loadSnapshots();
  const snap = all.find(s => s.id === snapshotId);
  if (!snap) return { ok: false, warnings: ["快照不存在"] };
  return { ok: true, forkedWorldId: `${snap.worldId}-fork-${Date.now().toString(36)}`, snapshot: snap, warnings: [] };
}
