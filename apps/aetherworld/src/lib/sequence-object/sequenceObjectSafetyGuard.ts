// sequenceObjectSafetyGuard.ts
import { SEQUENCE_OBJECT_SAFETY_RULES, SEQUENCE_OBJECT_SAFETY_NOTE } from "@/constants/sequence-object/sequenceObjectSafetyRules";
import type { MeaningDriftCheck } from "./sequenceObjectMeaningDriftDetector";
import type { SequenceObjectQaResult } from "./sequenceObjectQaBridge";

export interface SafetyGuardResult {
  blocked: boolean;
  warnings: string[];
  appliedRules: string[];
}

export function runObjectSafetyGuard(drift: MeaningDriftCheck, qa: SequenceObjectQaResult): SafetyGuardResult {
  const warnings: string[] = [];
  let blocked = false;
  if (drift.level === "BLOCK") { blocked = true; warnings.push("意义漂移 CRITICAL，已阻断。"); }
  if (qa.status === "BLOCKED") { blocked = true; warnings.push("QA BLOCKED，已阻断。"); }
  if (qa.status === "FAIL") warnings.push("QA FAIL，建议修复后再发布。");
  return {
    blocked,
    warnings,
    appliedRules: SEQUENCE_OBJECT_SAFETY_RULES.map((r) => r.id),
  };
}

export { SEQUENCE_OBJECT_SAFETY_NOTE };
