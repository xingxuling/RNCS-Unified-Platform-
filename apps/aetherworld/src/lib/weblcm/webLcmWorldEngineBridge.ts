import type { AetherConcept } from "./webLcmTypes";
import { extractConcepts } from "./webLcmConceptExtractor";

export interface WorldObjectLike { id: string; kind: "WORLD" | "NPC" | "QUEST" | "REGION" | "SEMANTIC_PHYSICS"; title: string; description?: string; }

const KIND_TO_TYPE: Record<WorldObjectLike["kind"], AetherConcept["conceptType"]> = {
  WORLD: "WORLD_CONCEPT", NPC: "CHARACTER_CONCEPT", QUEST: "NARRATIVE_CONCEPT", REGION: "WORLD_CONCEPT", SEMANTIC_PHYSICS: "SYSTEM_CONCEPT",
};

export function worldObjectToConcepts(obj: WorldObjectLike): AetherConcept[] {
  const text = `${obj.title}。${obj.description ?? ""}`;
  const concepts = extractConcepts({
    text,
    sourceType: obj.kind === "NPC" ? "NPC_OBJECT" : obj.kind === "QUEST" ? "QUEST_EVENT_OBJECT" : "WORLD_OBJECT",
    sourceObjectId: obj.id,
    hintConceptType: KIND_TO_TYPE[obj.kind],
  });
  return concepts.map(c => ({ ...c, worldTags: [...c.worldTags, obj.kind], safetyNotes: [...c.safetyNotes, "虚拟世界不可现实化。"] }));
}
