import type {
  AetherConcept, AetherConceptChain, AetherConceptGraph,
  ConceptCompressionResult, ConceptPrediction, ConceptExpansionPlan,
} from "./webLcmTypes";
import { newId } from "./webLcmTypes";
import type { WebLcmRuntimeMode } from "@/constants/weblcm/webLcmRuntimeModes";
import { DEFAULT_WEB_LCM_RUNTIME_MODE } from "@/constants/weblcm/webLcmRuntimeModes";
import type { WebLcmCompressionProfile } from "@/constants/weblcm/webLcmCompressionProfiles";
import { DEFAULT_WEB_LCM_COMPRESSION_PROFILE } from "@/constants/weblcm/webLcmCompressionProfiles";
import type { WebLcmPredictionMode } from "@/constants/weblcm/webLcmPredictionModes";
import { DEFAULT_WEB_LCM_PREDICTION_MODE } from "@/constants/weblcm/webLcmPredictionModes";
import type { WebLcmConceptSource } from "@/constants/weblcm/webLcmConceptSources";

import { extractConcepts } from "./webLcmConceptExtractor";
import { attachVectors } from "./webLcmConceptVectorEngine";
import { buildConceptChain } from "./webLcmConceptChainEngine";
import { buildConceptGraph } from "./webLcmConceptGraphEngine";
import { predictNextConcepts } from "./webLcmConceptPredictor";
import { compressConcepts } from "./webLcmConceptCompressor";
import { buildExpansionPlan } from "./webLcmConceptExpander";
import { runWebLcmQa, type WebLcmQaReport } from "./webLcmQaBridge";
import { evaluateWebLcmSafety } from "./webLcmSafetyGuard";
import { recordWebLcmRun } from "./webLcmWorkspaceBridge";
import { detectWebLcmAvailability, type WebLcmAvailability } from "./webLcmAvailabilityDetector";

export interface RunWebLcmInput {
  text: string;
  sourceType?: WebLcmConceptSource;
  sourceObjectId?: string;
  domain?: string;
  runtimeMode?: WebLcmRuntimeMode;
  compressionProfile?: WebLcmCompressionProfile;
  predictionMode?: WebLcmPredictionMode;
  includeGraph?: boolean;
  includePrediction?: boolean;
  includeExpansion?: boolean;
  saveToWorkspace?: boolean;
}

export interface WebLcmRunResult {
  runId: string;
  runtimeMode: WebLcmRuntimeMode;
  concepts: AetherConcept[];
  chain: AetherConceptChain;
  graph?: AetherConceptGraph;
  compression: ConceptCompressionResult;
  prediction?: ConceptPrediction;
  expansion?: ConceptExpansionPlan;
  qa: WebLcmQaReport;
  safetyWarnings: string[];
  blocked: boolean;
  availability?: WebLcmAvailability;
  createdAt: string;
}

export async function runAetherWebLcm(input: RunWebLcmInput): Promise<WebLcmRunResult> {
  const runId = newId("wlrun");
  const runtimeMode = input.runtimeMode ?? DEFAULT_WEB_LCM_RUNTIME_MODE;
  const sourceType = input.sourceType ?? "USER_INPUT";

  const safety = evaluateWebLcmSafety(input.text);
  if (safety.blocked) {
    const emptyConcepts: AetherConcept[] = [];
    const emptyChain = buildConceptChain(emptyConcepts, { title: "Blocked" });
    return {
      runId, runtimeMode, concepts: emptyConcepts, chain: emptyChain,
      compression: { compressionId: newId("comp"), sourceObjectId: input.sourceObjectId ?? "blocked", coreConcepts: [], compressionSummary: "", lostDetails: [], riskNotes: safety.warnings },
      qa: { status: "BLOCKED", issues: [{ ruleId: "SAFETY_BLOCK", severity: "CRITICAL", message: "输入触发安全规则。" }], checkedAt: new Date().toISOString() },
      safetyWarnings: safety.warnings, blocked: true, createdAt: new Date().toISOString(),
    };
  }

  const availability = await detectWebLcmAvailability();
  const rawConcepts = extractConcepts({ text: safety.sanitizedText ?? input.text, sourceType, sourceObjectId: input.sourceObjectId });
  const concepts = attachVectors(rawConcepts);
  const chain = buildConceptChain(concepts);
  const graph = input.includeGraph !== false ? buildConceptGraph(concepts, input.domain ?? "GENERAL") : undefined;
  const compression = compressConcepts(concepts, { profile: input.compressionProfile ?? DEFAULT_WEB_LCM_COMPRESSION_PROFILE, sourceObjectId: input.sourceObjectId });
  const prediction = input.includePrediction !== false ? predictNextConcepts(chain, { mode: input.predictionMode ?? DEFAULT_WEB_LCM_PREDICTION_MODE }) : undefined;
  const expansion = input.includeExpansion !== false ? buildExpansionPlan(chain, { targetEngine: "WEBLLM" }) : undefined;
  if (prediction) chain.predictedNextConcepts = prediction.predictedConcepts;
  const qa = runWebLcmQa({ concepts, chain, graph });
  chain.qaStatus = qa.status;
  if (graph) graph.qaStatus = qa.status;

  if (input.saveToWorkspace !== false) {
    try {
      recordWebLcmRun({
        runId, sourceType, concepts, chain, graph, compression, prediction, expansion,
        runtimeMode, qaStatus: qa.status,
      });
    } catch { /* localStorage may fail */ }
  }

  return {
    runId, runtimeMode, concepts, chain, graph, compression, prediction, expansion,
    qa, safetyWarnings: safety.warnings, blocked: false, availability,
    createdAt: new Date().toISOString(),
  };
}

export function summarizeRun(result: WebLcmRunResult): string {
  return [
    `Run ${result.runId}`,
    `模式：${result.runtimeMode}`,
    `概念数：${result.concepts.length}`,
    `概念链：${result.chain.compressionSummary}`,
    `QA：${result.qa.status}`,
  ].join("\n");
}
