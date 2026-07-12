import type { RegisteredWorld, WorldTransferRecord } from "./types";
import { shortId } from "./types";
import type { WorldTransferTypeId } from "@/constants/sequence-world/multiverse/worldTransferTypes";

export interface TransferInput {
  fromWorld: RegisteredWorld;
  toWorld: RegisteredWorld;
  transferType: WorldTransferTypeId;
  assetId: string;
  assetSummary: string;
  founderLockedCanon?: boolean;
}

export function transferAsset(input: TransferInput): WorldTransferRecord {
  const notes: string[] = ["内部虚拟资产，不可现实兑现，不构成投资标的。"];
  let allowed = true;
  let reason = "通过";
  const { fromWorld, toWorld } = input;
  if (fromWorld.ownerSubjectMode === "DEMO" && toWorld.ownerSubjectMode !== "DEMO") {
    allowed = false;
    reason = "Demo 资源不可污染 Real 世界。";
  } else if (fromWorld.privacyLevel === "USER_PRIVATE" && toWorld.privacyLevel === "PUBLIC_DEMO") {
    allowed = false;
    reason = "Full60 私有资产不可自动公开。";
  } else if (input.founderLockedCanon) {
    allowed = false;
    reason = "Founder Locked Canon 仅 Founder 可转移。";
  }
  if (!allowed) notes.push(reason);
  return {
    transferId: shortId("xfer"),
    fromWorldId: fromWorld.worldId,
    toWorldId: toWorld.worldId,
    transferType: input.transferType,
    assetId: input.assetId,
    assetSummary: input.assetSummary,
    allowed,
    reason,
    canonImpact: input.transferType === "CANON_REFERENCE" ? "REFERENCE_ONLY" : "SOFT",
    safetyNotes: notes,
  };
}
