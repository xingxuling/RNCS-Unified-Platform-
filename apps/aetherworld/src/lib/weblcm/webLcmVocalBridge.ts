import { extractConcepts } from "./webLcmConceptExtractor";
import { buildConceptChain } from "./webLcmConceptChainEngine";
import type { AetherConceptChain } from "./webLcmTypes";

export function vocalContextToConceptChain(text: string): AetherConceptChain {
  const concepts = extractConcepts({ text, sourceType: "SONG_OBJECT", hintConceptType: "VOCAL_CONCEPT" });
  return buildConceptChain(concepts, { title: "Vocal", chainType: "WORLD_TO_VOCAL_CHAIN" });
}
