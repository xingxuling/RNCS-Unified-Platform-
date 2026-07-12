import type { RegisteredWorld, WorldIdentity } from "./types";

export function deriveWorldIdentity(world: RegisteredWorld, coreSequence?: string): WorldIdentity {
  const digits = (coreSequence ?? world.worldId).replace(/\D/g, "").split("");
  const dominant = Array.from(new Set(digits)).slice(0, 5);
  const forbidden: string[] = [];
  if (world.privacyLevel === "USER_PRIVATE") forbidden.push("PUBLIC_DEMO");
  if (world.privacyLevel === "FOUNDER_PRIVATE") forbidden.push("PUBLIC_DEMO", "USER_PRIVATE");
  return {
    worldId: world.worldId,
    name: world.worldName,
    alias: [],
    coreSequence,
    dominantDigits: dominant.length ? dominant : ["1", "3", "7"],
    worldSignature: `WS-${world.worldId.slice(-6)}`,
    foundingEvent: `${world.worldName} 于 ${world.createdAt.slice(0, 10)} 被注册。`,
    primaryTheme: world.worldType,
    boundaryRules: [
      "虚拟世界结构，不代表现实",
      world.privacyLevel === "USER_PRIVATE" ? "默认本地，不自动公开" : "遵守 privacyLevel 边界",
    ],
    allowedConnections: ["DEMO_WORLD", "PERSONAL_WORLD", "NARRATIVE_WORLD"],
    forbiddenConnections: forbidden,
  };
}

export function validateIdentityChange(prev: WorldIdentity, next: WorldIdentity): { ok: boolean; reason?: string } {
  if (prev.worldId !== next.worldId) return { ok: false, reason: "worldId 不可更改。" };
  return { ok: true };
}
