import type { RegisteredWorld, SubjectMode } from "./types";
import { nowIso, shortId } from "./types";
import type { WorldTypeId } from "@/constants/sequence-world/multiverse/worldTypes";

export interface RegisterWorldInput {
  worldName: string;
  worldType: WorldTypeId;
  ownerSubjectMode: SubjectMode;
  sourceSequenceMode?: RegisteredWorld["sourceSequenceMode"];
  privacyLevel?: RegisteredWorld["privacyLevel"];
}

export function registerWorld(input: RegisterWorldInput): RegisteredWorld {
  const fromFull60 = input.sourceSequenceMode === "FULL_60" || input.ownerSubjectMode === "FULL_60";
  const isDemo = input.ownerSubjectMode === "DEMO" || input.worldType === "DEMO_WORLD";
  const isFounder = input.ownerSubjectMode === "FOUNDER" || input.worldType === "FOUNDER_WORLD";
  const privacyLevel: RegisteredWorld["privacyLevel"] =
    input.privacyLevel ??
    (isFounder ? "FOUNDER_PRIVATE" : isDemo ? "PUBLIC_DEMO" : fromFull60 ? "USER_PRIVATE" : "USER_PRIVATE");
  const notes: string[] = ["虚拟世界结构，不代表现实事实。"];
  if (privacyLevel === "USER_PRIVATE") notes.push("默认仅本地保存，加入网络前需用户确认。");
  if (isDemo) notes.push("Demo 世界不可污染 Real 世界。");
  if (isFounder) notes.push("Founder-only 世界仅创始人可访问。");
  return {
    worldId: shortId("world"),
    worldName: input.worldName,
    worldType: input.worldType,
    sourceSequenceMode: input.sourceSequenceMode ?? (fromFull60 ? "FULL_60" : isDemo ? "DEMO" : "LIGHT_20"),
    ownerSubjectMode: input.ownerSubjectMode,
    privacyLevel,
    currentPhase: "INITIALIZED",
    canonCount: 0,
    npcCount: 0,
    assetCount: 0,
    portalCount: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    safetyNotes: notes,
  };
}

export function listWorlds(existing: RegisteredWorld[]): RegisteredWorld[] {
  return [...existing].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function ensureMaxWorlds(existing: RegisteredWorld[], max = 7): { allowed: boolean; reason?: string } {
  if (existing.length >= max) {
    return { allowed: false, reason: `已达到 maxWorlds 上限 (${max})，请先归档或删除世界。` };
  }
  return { allowed: true };
}

export function buildDemoWorldRegistry(): RegisteredWorld[] {
  return [
    registerWorld({ worldName: "起点之城", worldType: "PERSONAL_WORLD", ownerSubjectMode: "DEMO" }),
    registerWorld({ worldName: "归墟档案", worldType: "ARCHIVE_WORLD", ownerSubjectMode: "DEMO" }),
    registerWorld({ worldName: "梦回之境", worldType: "NARRATIVE_WORLD", ownerSubjectMode: "DEMO" }),
  ];
}
