// sequenceObjectLifecycleBridge.ts
import type { SequenceObjectLifecyclePhase } from "@/constants/sequence-object/sequenceObjectLifecyclePhases";
import type { SequenceObjectLayer } from "@/constants/sequence-object/sequenceObjectLayers";

export interface SequenceObjectLifecycleState {
  phase: SequenceObjectLifecyclePhase;
  ownerIdentity: "ACTIVE" | "SHIFTING" | "DECOUPLED";
  energyDemand: "LOW" | "MEDIUM" | "HIGH";
  returnType: "MEANING" | "CASH" | "INFLUENCE" | "NONE";
  entropy: "LOW" | "MEDIUM" | "HIGH";
  lastReview: string;
  nextReviewSuggestion: string;
  clmReason: string;
}

export function initialLifecycle(layer: SequenceObjectLayer): SequenceObjectLifecycleState {
  return {
    phase: "SEED",
    ownerIdentity: "ACTIVE",
    energyDemand: layer === "CIVILIZATION_LAYER" ? "HIGH" : layer === "RUNTIME_LAYER" ? "MEDIUM" : "LOW",
    returnType: "MEANING",
    entropy: "LOW",
    lastReview: new Date().toISOString(),
    nextReviewSuggestion: layer === "CIVILIZATION_LAYER" ? "+7d 周期复审" : "+30d",
    clmReason: "新生成对象，默认 SEED。CLM 防止创造物反噬创造者。",
  };
}

export function transitionLifecycle(state: SequenceObjectLifecycleState, event: "SAVED" | "REUSED_MANY" | "LOSING_TARGET" | "CONFLICT" | "ARCHIVE_NOW" | "TERMINATE_NOW"): SequenceObjectLifecycleState {
  const next: SequenceObjectLifecycleState = { ...state, lastReview: new Date().toISOString() };
  switch (event) {
    case "SAVED": if (state.phase === "SEED") next.phase = "GROWTH"; break;
    case "REUSED_MANY": next.phase = "STABLE"; break;
    case "LOSING_TARGET": next.phase = "TRANSITION"; next.entropy = "MEDIUM"; break;
    case "CONFLICT": next.phase = "TRANSITION"; next.entropy = "HIGH"; next.ownerIdentity = "SHIFTING"; break;
    case "ARCHIVE_NOW": next.phase = "ARCHIVE"; break;
    case "TERMINATE_NOW": next.phase = "TERMINATED"; next.ownerIdentity = "DECOUPLED"; break;
  }
  return next;
}
