import type { SequenceAIIntentResult } from "./sequenceAIIntentClassifier";
import type { SequenceAIPlan } from "./sequenceAIEnginePlanner";
import type { SafetyVerdict } from "./sequenceAISafetyGovernor";

export interface SequenceAITraceEntry {
  ts: number;
  stage: "INTENT" | "CONTEXT" | "PLAN" | "SAFETY" | "RESPONSE" | "HANDOFF";
  detail: string;
  data?: unknown;
}

const buffer: SequenceAITraceEntry[] = [];
const MAX_BUFFER = 200;

export function logTrace(stage: SequenceAITraceEntry["stage"], detail: string, data?: unknown): void {
  buffer.unshift({ ts: Date.now(), stage, detail, data });
  if (buffer.length > MAX_BUFFER) buffer.length = MAX_BUFFER;
}

export function getRecentTraces(): SequenceAITraceEntry[] {
  return buffer.slice();
}

export function summarizeTraces(intent: SequenceAIIntentResult, plan: SequenceAIPlan, safety: SafetyVerdict): string {
  return [
    `intent=${intent.intent} confidence=${intent.confidence.toFixed(2)}`,
    `primary=${plan.primaryEngine}`,
    `supporting=${plan.supportingEngines.join(",") || "none"}`,
    `safety=${safety.highestSeverity}`,
  ].join(" | ");
}
