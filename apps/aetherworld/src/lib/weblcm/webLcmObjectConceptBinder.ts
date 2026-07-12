import type { AetherConcept, ObjectConceptBinding } from "./webLcmTypes";
import { newId } from "./webLcmTypes";

export function bindConceptsToObject(
  objectId: string,
  concepts: AetherConcept[],
  bindingType: ObjectConceptBinding["bindingType"] = "EXTRACTED_FROM",
): ObjectConceptBinding {
  const sorted = [...concepts].sort((a, b) => b.confidence - a.confidence);
  return {
    bindingId: newId("bind"),
    objectId,
    conceptIds: sorted.map(c => c.conceptId),
    primaryConceptId: sorted[0]?.conceptId ?? "",
    bindingType,
    createdAt: new Date().toISOString(),
  };
}
