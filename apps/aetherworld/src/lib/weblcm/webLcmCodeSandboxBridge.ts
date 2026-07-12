import { extractConcepts } from "./webLcmConceptExtractor";
import { buildConceptChain } from "./webLcmConceptChainEngine";
import type { AetherConceptChain } from "./webLcmTypes";

export function errorLogToConceptChain(log: string): AetherConceptChain {
  const concepts = extractConcepts({ text: log, sourceType: "CODE_RUN_LOG", hintConceptType: "ERROR_CONCEPT" });
  return buildConceptChain(concepts, { title: "Error → Patch", chainType: "ERROR_TO_PATCH_CHAIN" });
}
