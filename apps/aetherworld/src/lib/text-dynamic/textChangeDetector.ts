// Text Change Detector — central trigger entry (see spec §3, §14)
import type { TextTriggerType } from "@/constants/text-dynamic/textTriggerTypes";
import { analyzeImpact, type TextWeightImpactInput, type TextWeightImpactResult } from "./textWeightImpactAnalyzer";
import { TEXT_REGISTRY } from "./textRegistry";

export interface TextDetectionResult {
  triggerType: TextTriggerType;
  impact: TextWeightImpactResult;
  newlyMarkedStale: string[];
  alreadyStale: string[];
  detectedAt: string;
}

let lastDetection: TextDetectionResult | null = null;

export function detectTextImpact(input: TextWeightImpactInput): TextDetectionResult {
  const impact = analyzeImpact(input);
  const newlyMarkedStale: string[] = [];
  const alreadyStale: string[] = [];

  for (const textId of impact.affectedTextIds) {
    const entry = TEXT_REGISTRY.find((x) => x.textId === textId);
    if (!entry) continue;
    if (entry.stale) {
      alreadyStale.push(textId);
    } else {
      entry.stale = true;
      entry.staleReason = `Triggered by ${input.triggerType}`;
      newlyMarkedStale.push(textId);
    }
  }

  lastDetection = {
    triggerType: input.triggerType,
    impact,
    newlyMarkedStale, alreadyStale,
    detectedAt: new Date().toISOString(),
  };
  return lastDetection;
}

export function getLastDetection(): TextDetectionResult | null {
  return lastDetection;
}
