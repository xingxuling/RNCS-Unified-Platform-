import type { AetherConceptChain, ConceptExpansionPlan } from "./webLcmTypes";
import { buildExpansionPlan } from "./webLcmConceptExpander";

export interface WebLcmToWebLlmRequest {
  plan: ConceptExpansionPlan;
  promptForWebLlm: string;
  safetyRules: string[];
}

export function buildWebLlmRequestFromChain(chain: AetherConceptChain): WebLcmToWebLlmRequest {
  const plan = buildExpansionPlan(chain, { targetEngine: "WEBLLM" });
  return {
    plan,
    promptForWebLlm: plan.expansionPrompt,
    safetyRules: plan.safetyRules,
  };
}

export interface WebLlmDriftCheck { drifted: boolean; reason: string; }

export function checkWebLlmOutputDrift(chain: AetherConceptChain, webLlmText: string): WebLlmDriftCheck {
  const keys = new Set<string>();
  for (const c of chain.orderedConcepts) c.keywords.forEach(k => keys.add(k.toLowerCase()));
  const hit = Array.from(keys).filter(k => webLlmText.toLowerCase().includes(k)).length;
  const coverage = keys.size === 0 ? 1 : hit / keys.size;
  return {
    drifted: coverage < 0.25,
    reason: coverage < 0.25 ? `WebLLM 输出仅覆盖 ${(coverage * 100).toFixed(0)}% 概念关键词，可能漂离概念链。` : `WebLLM 输出覆盖 ${(coverage * 100).toFixed(0)}% 概念关键词。`,
  };
}
