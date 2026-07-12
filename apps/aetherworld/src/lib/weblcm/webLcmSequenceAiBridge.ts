import type { AetherConcept, AetherConceptChain } from "./webLcmTypes";
import type { WebLcmRuntimeMode } from "@/constants/weblcm/webLcmRuntimeModes";
import type { WebLcmCompressionProfile } from "@/constants/weblcm/webLcmCompressionProfiles";
import type { WebLcmPredictionMode } from "@/constants/weblcm/webLcmPredictionModes";

export interface SequenceAiWebLcmEnrichment {
  useWebLcm: boolean;
  webLcmRuntimeMode: WebLcmRuntimeMode;
  conceptCompressionProfile: WebLcmCompressionProfile;
  conceptPredictionMode: WebLcmPredictionMode;
  webLcmUsed: boolean;
  conceptChainId?: string;
  conceptGraphId?: string;
  primaryConcepts: string[];
  conceptCompressionSummary?: string;
  webLlmExpansionUsed?: boolean;
  qaRequired: boolean;
}

export function enrichSequenceAiWithWebLcm(args: {
  concepts: AetherConcept[];
  chain?: AetherConceptChain;
  mode: WebLcmRuntimeMode;
  profile: WebLcmCompressionProfile;
  predictionMode: WebLcmPredictionMode;
  webLlmExpansionUsed?: boolean;
}): SequenceAiWebLcmEnrichment {
  return {
    useWebLcm: true,
    webLcmRuntimeMode: args.mode,
    conceptCompressionProfile: args.profile,
    conceptPredictionMode: args.predictionMode,
    webLcmUsed: args.concepts.length > 0,
    conceptChainId: args.chain?.chainId,
    primaryConcepts: args.concepts.slice(0, 5).map(c => c.title),
    conceptCompressionSummary: args.chain?.compressionSummary,
    webLlmExpansionUsed: args.webLlmExpansionUsed ?? false,
    qaRequired: true,
  };
}
