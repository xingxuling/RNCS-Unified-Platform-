// NPC 关系引擎
import type { VirtualWorldSeedResult } from "./virtualWorldSeedCompiler";
import type { WorldZone } from "./worldMapGenerationEngine";
import { NPC_ARCHETYPES, type RelationshipState } from "@/constants/npcArchetypes";

export interface GeneratedNPC {
  id: string;
  name: string;
  archetype: string;
  archetypeId: string;
  relationshipState: RelationshipState;
  roleInWorld: string;
  relatedDimension: string;
  relatedQuestIds: string[];
  trustLevel: number;
  riskLevel: number;
  description: string;
  possibleManifestations: string[];
}

const STATE_BY_INDEX: RelationshipState[] = ["APPROACHING", "ACTIVE", "DISTANT", "UNKNOWN", "CONFLICT", "LOCKED"];

export function generateNPCs(seed: VirtualWorldSeedResult, zones: WorldZone[]): GeneratedNPC[] {
  const zoneByDim = new Map(zones.map(z => [z.dimensionId, z]));
  return NPC_ARCHETYPES.map((arch, i) => {
    const zone = zoneByDim.get(arch.relatedDimension);
    const state = STATE_BY_INDEX[(i + seed.dominantNumber) % STATE_BY_INDEX.length];
    const npc: GeneratedNPC = {
      id: `npc-${arch.id}`,
      name: `${arch.name} #${seed.seedSignature.slice(0, 2)}${i}`,
      archetype: arch.name,
      archetypeId: arch.id,
      relationshipState: state,
      roleInWorld: `所属区域：${zone?.zoneName ?? "未知"}`,
      relatedDimension: arch.relatedDimension,
      relatedQuestIds: zone?.currentQuestIds ?? [],
      trustLevel: arch.defaultTrust,
      riskLevel: arch.defaultRisk,
      description: arch.description,
      possibleManifestations: [
        "可能表现为身边某位扮演此角色的人",
        "可能是某次互动中临时出现的对象",
        "可能是自我内部投射的关系原型",
      ],
    };
    if (zone) zone.relatedNPCIds.push(npc.id);
    return npc;
  });
}
