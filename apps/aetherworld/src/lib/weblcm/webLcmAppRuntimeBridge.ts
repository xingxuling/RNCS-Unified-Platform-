import { extractConcepts } from "./webLcmConceptExtractor";
import { buildConceptChain } from "./webLcmConceptChainEngine";
import type { AetherConceptChain } from "./webLcmTypes";

export function appIdeaToConceptChain(idea: string): AetherConceptChain {
  const concepts = extractConcepts({ text: idea, sourceType: "USER_INPUT", hintConceptType: "APP_CONCEPT" });
  return buildConceptChain(concepts, { title: "App Idea", chainType: "APP_IDEA_TO_PROJECT_CHAIN" });
}
