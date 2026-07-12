import type { RegisteredWorld, WorldPortal } from "./types";
import { shortId } from "./types";
import type { PortalTypeId } from "@/constants/sequence-world/multiverse/portalTypes";
import type { WorldTransferTypeId } from "@/constants/sequence-world/multiverse/worldTransferTypes";

export interface CreatePortalInput {
  fromWorld: RegisteredWorld;
  toWorld: RegisteredWorld;
  portalType: PortalTypeId;
  allowedTransferTypes?: WorldTransferTypeId[];
}

export function createPortal(input: CreatePortalInput): { portal: WorldPortal | null; reason?: string } {
  const { fromWorld, toWorld } = input;
  if (fromWorld.worldId === toWorld.worldId) return { portal: null, reason: "不能连接到自身。" };
  if (fromWorld.privacyLevel === "FOUNDER_PRIVATE" && toWorld.privacyLevel !== "FOUNDER_PRIVATE") {
    return { portal: null, reason: "Founder 世界不能直连普通世界，需 Founder Gate。" };
  }
  const isDemoReal =
    (fromWorld.ownerSubjectMode === "DEMO" && toWorld.ownerSubjectMode !== "DEMO") ||
    (toWorld.ownerSubjectMode === "DEMO" && fromWorld.ownerSubjectMode !== "DEMO");
  if (isDemoReal) return { portal: null, reason: "Demo 与 Real 世界之间禁止直接门户。" };
  const notes = ["世界门户为虚拟结构，不代表现实行动。"];
  if (fromWorld.privacyLevel === "USER_PRIVATE" || toWorld.privacyLevel === "USER_PRIVATE")
    notes.push("涉及 USER_PRIVATE 世界，请确认隐私边界。");
  return {
    portal: {
      portalId: shortId("portal"),
      fromWorldId: fromWorld.worldId,
      toWorldId: toWorld.worldId,
      portalType: input.portalType,
      accessRule: input.portalType === "FOUNDER_GATE" ? "FOUNDER_ONLY" : "OWNER_AND_INVITED",
      stability: 0.7,
      transferAllowed: input.portalType !== "LOCKED_GATE",
      allowedTransferTypes: input.allowedTransferTypes ?? ["LORE_IMPORT", "CANON_REFERENCE"],
      requiredPermission: input.portalType === "FOUNDER_GATE" ? "FOUNDER" : "USER_LOCAL",
      visualStyle: "auric-glyph",
      safetyNotes: notes,
    },
  };
}

export function listPortals(portals: WorldPortal[], worldId?: string): WorldPortal[] {
  if (!worldId) return portals;
  return portals.filter((p) => p.fromWorldId === worldId || p.toWorldId === worldId);
}
