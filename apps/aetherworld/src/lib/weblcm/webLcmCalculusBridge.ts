import type { AetherConcept } from "./webLcmTypes";
import { extractConcepts } from "./webLcmConceptExtractor";

export interface CalculusEntryLike {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
}

export function calculusEntryToConcepts(entry: CalculusEntryLike): AetherConcept[] {
  const text = `${entry.title}。${entry.description ?? ""}`;
  const concepts = extractConcepts({
    text,
    sourceType: "CALCULUS_ENTRY",
    sourceObjectId: entry.id,
    hintConceptType: "CALCULUS_CONCEPT",
    domainTags: entry.tags ?? [],
  });
  return concepts.map(c => ({ ...c, calculusTags: [...c.calculusTags, entry.id] }));
}

export function selectCalculusForIntent(intent: string, entries: CalculusEntryLike[]): CalculusEntryLike[] {
  const q = intent.toLowerCase();
  return entries.filter(e => q.includes(e.title.toLowerCase()) || (e.description ?? "").toLowerCase().includes(q)).slice(0, 5);
}
