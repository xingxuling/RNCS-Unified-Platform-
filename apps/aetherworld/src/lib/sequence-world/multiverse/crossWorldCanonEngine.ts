import type { CrossWorldCanonLink, CrossWorldCanonState, RegisteredWorld } from "./types";
import { shortId } from "./types";

export function buildCrossWorldCanon(worlds: RegisteredWorld[]): CrossWorldCanonState {
  const links: CrossWorldCanonLink[] = [];
  for (let i = 0; i + 1 < worlds.length; i++) {
    const a = worlds[i];
    const b = worlds[i + 1];
    const founder = a.privacyLevel === "FOUNDER_PRIVATE" || b.privacyLevel === "FOUNDER_PRIVATE";
    links.push({
      linkId: shortId("clink"),
      sourceWorldId: a.worldId,
      targetWorldId: b.worldId,
      canonEntryId: `canon_${a.worldId.slice(-4)}`,
      linkType: founder ? "FOUNDER_LOCK" : "REFERENCE",
      allowed: !founder,
      reason: founder ? "Founder Locked Canon。" : "正典引用，仅 REFERENCE。",
    });
  }
  const conflicts = worlds
    .filter((w) => w.ownerSubjectMode === "DEMO")
    .flatMap((w) =>
      worlds
        .filter((x) => x.ownerSubjectMode !== "DEMO")
        .map((x) => ({
          conflictId: shortId("cnflct"),
          type: "DEMO_REAL_CONFLICT",
          worldIds: [w.worldId, x.worldId],
          description: `Demo 世界 ${w.worldName} 与 Real 世界 ${x.worldName} 之间的正典需隔离。`,
        })),
    )
    .slice(0, 3);
  return {
    canonLinks: links,
    conflicts,
    sharedCanonEntries: links.filter((l) => l.allowed).map((l) => l.canonEntryId),
    isolatedCanonEntries: links.filter((l) => !l.allowed).map((l) => l.canonEntryId),
  };
}
