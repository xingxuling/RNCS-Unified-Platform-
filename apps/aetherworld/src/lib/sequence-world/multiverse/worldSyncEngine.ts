import type { RegisteredWorld, WorldConflict, WorldSyncState } from "./types";
import { nowIso } from "./types";

export function buildSyncState(
  networkId: string,
  worlds: RegisteredWorld[],
  conflicts: WorldConflict[],
  syncMode: WorldSyncState["syncMode"] = "MANUAL",
): WorldSyncState {
  const synced = worlds
    .filter((w) => w.privacyLevel !== "USER_PRIVATE" && w.privacyLevel !== "FOUNDER_PRIVATE")
    .map((w) => w.worldId);
  const stale = worlds.filter((w) => !synced.includes(w.worldId)).map((w) => w.worldId);
  return {
    networkId,
    syncedWorldIds: synced,
    staleWorldIds: stale,
    syncConflicts: conflicts.filter((c) => c.severity === "HIGH" || c.severity === "CRITICAL"),
    lastSyncedAt: nowIso(),
    syncMode,
  };
}
