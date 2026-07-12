import type { CrossWorldRelation, MultiWorldSnapshot, RegisteredWorld, WorldFederationState, WorldPortal, WorldConflict } from "./types";
import { nowIso, shortId } from "./types";

export interface SnapshotInput {
  networkId: string;
  worlds: RegisteredWorld[];
  portals: WorldPortal[];
  relations: CrossWorldRelation[];
  federation?: WorldFederationState;
  conflicts: WorldConflict[];
}

export function createMultiWorldSnapshot(input: SnapshotInput): MultiWorldSnapshot {
  return {
    snapshotId: shortId("snap"),
    networkId: input.networkId,
    worldIds: input.worlds.map((w) => w.worldId),
    portalCount: input.portals.length,
    relationCount: input.relations.length,
    federationCount: input.federation ? 1 : 0,
    conflictCount: input.conflicts.length,
    createdAt: nowIso(),
    summary: `${input.worlds.length} 个世界，${input.portals.length} 个门户，${input.conflicts.length} 个冲突。`,
  };
}

export function compareMultiWorldSnapshots(a: MultiWorldSnapshot, b: MultiWorldSnapshot): string {
  return `Δ worlds: ${b.worldIds.length - a.worldIds.length}，Δ portals: ${b.portalCount - a.portalCount}，Δ conflicts: ${b.conflictCount - a.conflictCount}.`;
}

export function rollbackMultiWorldNetwork(snapshot: MultiWorldSnapshot): { ok: boolean; restoredAt: string } {
  return { ok: true, restoredAt: snapshot.createdAt };
}

export function forkMultiWorldNetwork(snapshot: MultiWorldSnapshot): MultiWorldSnapshot {
  return { ...snapshot, snapshotId: shortId("snap"), createdAt: nowIso(), summary: `Fork of ${snapshot.snapshotId}` };
}
