import type { AetherConcept } from "./webLcmTypes";
import { extractConcepts } from "./webLcmConceptExtractor";

export interface ConstantEntryLike { id: string; title: string; description?: string; }

export function constantEntryToConcepts(entry: ConstantEntryLike): AetherConcept[] {
  const text = `${entry.title}。${entry.description ?? ""}`;
  const concepts = extractConcepts({
    text,
    sourceType: "CONSTANT_ENTRY",
    sourceObjectId: entry.id,
    hintConceptType: "CONSTANT_CONCEPT",
  });
  return concepts.map(c => ({ ...c, constantTags: [...c.constantTags, entry.id], safetyNotes: [...c.safetyNotes, "常数宇宙非现实物理。"] }));
}
