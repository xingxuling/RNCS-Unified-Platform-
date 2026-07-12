import type { CrossWorldCanonState, RegisteredWorld, WorldConflict, WorldPortal } from "./types";
import { shortId } from "./types";

export function detectConflicts(
  worlds: RegisteredWorld[],
  portals: WorldPortal[],
  canon: CrossWorldCanonState,
): WorldConflict[] {
  const conflicts: WorldConflict[] = [];
  // DEMO/REAL portal misuse
  portals.forEach((p) => {
    const from = worlds.find((w) => w.worldId === p.fromWorldId);
    const to = worlds.find((w) => w.worldId === p.toWorldId);
    if (!from || !to) return;
    if (from.ownerSubjectMode === "DEMO" && to.ownerSubjectMode !== "DEMO") {
      conflicts.push({
        conflictId: shortId("cf"),
        conflictType: "DEMO_REAL_CONFLICT",
        involvedWorldIds: [from.worldId, to.worldId],
        rootCause: "Demo 世界与 Real 世界之间的门户。",
        severity: "CRITICAL",
        suggestedResolution: "block",
        autoFixAvailable: true,
      });
    }
    if (to.privacyLevel === "FOUNDER_PRIVATE" && p.requiredPermission !== "FOUNDER") {
      conflicts.push({
        conflictId: shortId("cf"),
        conflictType: "PERMISSION_CONFLICT",
        involvedWorldIds: [from.worldId, to.worldId],
        rootCause: "未经 FOUNDER 权限连入 Founder 世界。",
        severity: "CRITICAL",
        suggestedResolution: "block",
        autoFixAvailable: true,
      });
    }
  });
  canon.conflicts.forEach((c) =>
    conflicts.push({
      conflictId: c.conflictId,
      conflictType: c.type,
      involvedWorldIds: c.worldIds,
      rootCause: c.description,
      severity: c.type === "DEMO_REAL_CONFLICT" ? "CRITICAL" : "MEDIUM",
      suggestedResolution: "isolate",
      autoFixAvailable: true,
    }),
  );
  return conflicts;
}
