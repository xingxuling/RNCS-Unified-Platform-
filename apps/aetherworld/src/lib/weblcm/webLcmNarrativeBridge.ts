import { extractConcepts } from "./webLcmConceptExtractor";
import { buildConceptChain } from "./webLcmConceptChainEngine";
import type { AetherConceptChain } from "./webLcmTypes";

export function narrativeContextToConceptChain(text: string): AetherConceptChain {
  const concepts = extractConcepts({ text, sourceType: "STORY_OBJECT", hintConceptType: "NARRATIVE_CONCEPT" });
  return buildConceptChain(concepts, { title: "Narrative", chainType: "WORLD_TO_NARRATIVE_CHAIN" });
}
