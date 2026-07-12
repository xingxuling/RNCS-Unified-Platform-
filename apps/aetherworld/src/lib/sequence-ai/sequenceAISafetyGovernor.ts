import { SEQUENCE_AI_SAFETY_RULES } from "@/constants/sequence-ai/sequenceAISafetyRules";
import type { SequenceAIIntentResult } from "./sequenceAIIntentClassifier";
import type { SequenceAIContext } from "./sequenceAIContextBuilder";

export interface SafetyVerdict {
  notes: string[];
  highestSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  block: boolean;
  blockedActions: string[];
}

const SEV_ORDER: SafetyVerdict["highestSeverity"][] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function runSafetyGovernor(
  userInput: string,
  draftAnswer: string,
  intent: SequenceAIIntentResult,
  ctx: SequenceAIContext,
): SafetyVerdict {
  const notes: string[] = [];
  const blocked: string[] = [];
  let highest: SafetyVerdict["highestSeverity"] = "LOW";

  const corpus = `${userInput}\n${draftAnswer}`;
  for (const rule of SEQUENCE_AI_SAFETY_RULES) {
    if (rule.match(corpus)) {
      notes.push(`【${rule.severity}】${rule.description}：${rule.suggestion}`);
      if (SEV_ORDER.indexOf(rule.severity) > SEV_ORDER.indexOf(highest)) {
        highest = rule.severity;
      }
    }
  }

  if (ctx.subjectMode === "FULL_60") {
    notes.push("Full 60 隐私提示：本次结果仅在本地呈现，请勿截图或上传至公开平台。");
  }
  if (intent.requiresFounderMode && !ctx.founderActive) {
    notes.push("该意图属于创始人级任务，已降级为安全说明。");
    blocked.push("FOUNDER_WRITE");
    if (SEV_ORDER.indexOf("HIGH") > SEV_ORDER.indexOf(highest)) highest = "HIGH";
  }

  const block = highest === "CRITICAL";
  if (block) {
    blocked.push("GENERATE_ASSET", "EXPORT", "HANDOFF_WRITE");
  }

  return { notes, highestSeverity: highest, block, blockedActions: blocked };
}
