import type { RegisteredWorld, WorldPortal, WorldTravelRecord, WorldTravelState } from "./types";
import { nowIso, shortId } from "./types";

export interface TravelInput {
  userId: string;
  state?: WorldTravelState;
  fromWorld: RegisteredWorld;
  toWorld: RegisteredWorld;
  portal: WorldPortal;
  purpose?: string;
}

export function travel(input: TravelInput): { state: WorldTravelState | null; reason?: string } {
  const { fromWorld, toWorld, portal } = input;
  if (portal.fromWorldId !== fromWorld.worldId || portal.toWorldId !== toWorld.worldId) {
    if (portal.portalType !== "TWO_WAY_PORTAL" || portal.fromWorldId !== toWorld.worldId || portal.toWorldId !== fromWorld.worldId) {
      return { state: null, reason: "门户方向不匹配。" };
    }
  }
  if (toWorld.privacyLevel === "FOUNDER_PRIVATE" && portal.requiredPermission !== "FOUNDER") {
    return { state: null, reason: "Founder 世界需要 FOUNDER 权限。" };
  }
  const record: WorldTravelRecord = {
    recordId: shortId("trv"),
    fromWorldId: fromWorld.worldId,
    toWorldId: toWorld.worldId,
    portalId: portal.portalId,
    traveledAt: nowIso(),
    purpose: input.purpose ?? "探索",
    resultSummary: `用户从 ${fromWorld.worldName} 进入 ${toWorld.worldName}。`,
  };
  const visited = new Set([...(input.state?.visitedWorldIds ?? [fromWorld.worldId]), toWorld.worldId]);
  return {
    state: {
      userId: input.userId,
      currentWorldId: toWorld.worldId,
      previousWorldId: fromWorld.worldId,
      visitedWorldIds: [...visited],
      travelHistory: [...(input.state?.travelHistory ?? []), record],
      currentRoleInWorld: toWorld.privacyLevel === "FOUNDER_PRIVATE" ? "FOUNDER" : "VISITOR",
      permissionsInCurrentWorld: ["READ", "OBSERVE"],
      travelRisks:
        toWorld.privacyLevel === "USER_PRIVATE" ? ["涉及个人世界，仅虚拟事件，不代表现实行动。"] : ["虚拟事件，不代表现实行动。"],
    },
  };
}
