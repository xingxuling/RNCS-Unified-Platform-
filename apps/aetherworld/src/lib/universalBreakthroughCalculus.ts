import { recognizeObject, type ObjectRecognitionResult } from "./objectRecognitionEngine";
import { mapFiveDomains, type FiveDomainMapping } from "./fiveDomainMappingEngine";
import { detectConstantGaps, type ConstantGapResult } from "./constantGapDetector";
import { analyzeResistance, type ResistanceReductionResult } from "./resistanceReductionEngine";
import { resolveActionPermission, type ActionPermissionResult } from "./actionPermissionResolver";
import { generateSolutionPath, type SolutionPath } from "./solutionPathGenerator";
import { generateValidationPath, type ValidationPath } from "./validationPathGenerator";
import { recursiveResolve, type RecursiveResolveSuggestion, type RecursiveFailureType } from "./recursiveReseolver";
import { checkBreakthroughSafety, type BreakthroughSafetyFinding, SAFETY_DISCLAIMERS } from "./breakthroughSafetyGuard";

export interface UniversalBreakthroughInput {
  text: string;
  objectTypeId?: string;
  beginner?: boolean;
  observedFailure?: RecursiveFailureType;
}

export interface UniversalBreakthroughResult {
  input: UniversalBreakthroughInput;
  recognition: ObjectRecognitionResult;
  domains: FiveDomainMapping;
  gaps: ConstantGapResult;
  resistance: ResistanceReductionResult;
  permission: ActionPermissionResult;
  solution: SolutionPath;
  validation: ValidationPath;
  recursion: RecursiveResolveSuggestion[];
  safety: BreakthroughSafetyFinding[];
  score: number; // 0-1
  disclaimer: string;
  beginnerSummary: {
    realStuckPoint: string;
    mostMissing: string;
    bestNextAction: string;
    avoid: string[];
    howToValidate: string[];
  };
}

export function runUniversalBreakthrough(input: UniversalBreakthroughInput): UniversalBreakthroughResult {
  const recognition = recognizeObject(input.text, input.objectTypeId);
  const domains = mapFiveDomains(input.text, recognition.objectType);
  const gaps = detectConstantGaps(input.text, domains, recognition.objectType);
  const resistance = analyzeResistance(input.text, recognition.objectType);
  const permission = resolveActionPermission(gaps, resistance, domains, recognition.objectType);
  const solution = generateSolutionPath(recognition, domains, gaps, resistance, permission);
  const validation = generateValidationPath(recognition, solution);
  const recursion = recursiveResolve(solution, validation, input.observedFailure);
  const safety = checkBreakthroughSafety({
    inputText: input.text,
    path: solution,
    validation,
    recursion,
    beginner: input.beginner ?? false,
  });

  // Universal Breakthrough Score
  const num =
    recognition.confidence *
    (1 - resistance.remainingNoise * 0.4) *
    (gaps.missingNumbers.length > 0 ? 1 : 0.5) *
    (validation.successSignals.length ? 1 : 0.4) *
    (permission.riskLevel === "高" ? 0.6 : permission.riskLevel === "中" ? 0.8 : 1);
  const score = Math.max(0, Math.min(1, num));

  return {
    input,
    recognition, domains, gaps, resistance, permission,
    solution, validation, recursion, safety,
    score: Number(score.toFixed(2)),
    disclaimer: input.beginner ? SAFETY_DISCLAIMERS.short : SAFETY_DISCLAIMERS.full,
    beginnerSummary: {
      realStuckPoint: `${gaps.keyGap}：${gaps.gapExplanation}`,
      mostMissing: gaps.recommended补法[0] ?? "需要先补一项基础。",
      bestNextAction: `${permission.primaryAction} — ${permission.reason}`,
      avoid: permission.forbiddenActions,
      howToValidate: validation.successSignals,
    },
  };
}

export const PRESET_EXAMPLES = [
  "用户看不懂我的产品怎么办？",
  "小红书阅读量上不去怎么办？",
  "我现在该不该推进这个项目？",
  "我脑子很乱但又想继续生成系统怎么办？",
  "一个虚拟世界底层系统缺什么？",
];
