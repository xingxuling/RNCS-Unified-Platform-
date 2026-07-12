import type { CrossWorldRelation, RegisteredWorld } from "./types";
import { shortId } from "./types";
import type { CrossWorldRelationTypeId } from "@/constants/sequence-world/multiverse/crossWorldRelationTypes";

export function buildRelation(
  a: RegisteredWorld,
  b: RegisteredWorld,
  relationType: CrossWorldRelationTypeId,
): CrossWorldRelation {
  const compat = a.worldType === b.worldType ? 0.8 : 0.5;
  return {
    relationId: shortId("rel"),
    worldA: a.worldId,
    worldB: b.worldId,
    relationType,
    strength: 0.5,
    trust: relationType === "ALLIED_WORLD" ? 0.8 : 0.5,
    conflict: relationType === "RIVAL_WORLD" || relationType === "CANON_CONFLICT" ? 0.7 : 0.2,
    resourceFlow: relationType === "TRADE_WORLD" ? 0.7 : 0.2,
    canonCompatibility: compat,
    narrativeCompatibility: compat,
    history: [`${a.worldName} ↔ ${b.worldName} 建立 ${relationType} 关系。`],
  };
}

export function deriveAllRelations(worlds: RegisteredWorld[]): CrossWorldRelation[] {
  const out: CrossWorldRelation[] = [];
  for (let i = 0; i < worlds.length; i++) {
    for (let j = i + 1; j < Math.min(i + 3, worlds.length); j++) {
      const type: CrossWorldRelationTypeId =
        worlds[j].worldType === "ARCHIVE_WORLD" ? "ARCHIVE_PARENT" : "ALLIED_WORLD";
      out.push(buildRelation(worlds[i], worlds[j], type));
    }
  }
  return out;
}
