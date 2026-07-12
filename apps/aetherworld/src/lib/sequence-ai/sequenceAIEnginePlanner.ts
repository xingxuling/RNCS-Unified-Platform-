import { SEQUENCE_AI_TOOL_POLICIES, type SequenceAIToolPolicy } from "@/constants/sequence-ai/sequenceAIToolPolicies";
import type { SequenceAIIntentResult } from "./sequenceAIIntentClassifier";
import type { SequenceAIContext } from "./sequenceAIContextBuilder";

export interface SequenceAIPlan {
  primaryEngine: string;
  supportingEngines: string[];
  validationEngines: string[];
  exportOptions: string[];
  blockedEngines: string[];
  executionSteps: string[];
  reason: string;
}

const SUPPORTING_MAP: Record<string, string[]> = {
  universalBreakthrough: ["thingItselfCalculus", "eventUniverse", "usageExamples"],
  thingItselfCalculus:   ["msl", "productEncyclopedia"],
  narrativeTextEngine:   ["modelGeneration", "sequenceWorldEngine", "translationEngine"],
  vocalEngine:           ["translationEngine", "promptForge", "narrativeTextEngine"],
  sequenceWorldEngine:   ["msl", "modelGeneration", "engineExport"],
  modelGeneration:       ["msl", "promptForge"],
  translationEngine:     ["productEncyclopedia"],
  promptForge:           ["modelGeneration"],
  codeGeneration:        ["promptForge", "modelGeneration"],
  softwareQA:            ["systemIntegrationAudit", "recalculation", "productEncyclopedia"],
  recalculation:         ["softwareQA"],
  productEncyclopedia:   ["usageExamples"],
  virtualLife:           ["thingItselfCalculus", "narrativeTextEngine"],
  founderConsole:        ["softwareQA", "systemIntegrationAudit"],
  usageExamples:         [],
  engineExport:          ["modelGeneration", "sequenceWorldEngine"],
};

const VALIDATION_MAP: Record<string, string[]> = {
  universalBreakthrough: ["safetyBoundary", "softwareQA"],
  vocalEngine:           ["safetyBoundary", "softwareQA"],
  narrativeTextEngine:   ["safetyBoundary"],
  sequenceWorldEngine:   ["softwareQA", "safetyBoundary"],
  modelGeneration:       ["softwareQA"],
  codeGeneration:        ["softwareQA", "safetyBoundary"],
  default:               ["safetyBoundary"],
};

const EXPORT_MAP: Record<string, string[]> = {
  modelGeneration:     ["JSON", "TypeScript", "Zod", "Markdown"],
  sequenceWorldEngine: ["JSON", "Unity", "Godot"],
  narrativeTextEngine: ["Markdown", "JSON"],
  vocalEngine:         ["Suno Prompt", "Udio Prompt", "Markdown"],
  promptForge:         ["Lovable Prompt", "Codex Prompt"],
  translationEngine:   ["JSON", "Markdown"],
  default:             ["Markdown"],
};

export function planEngines(intent: SequenceAIIntentResult, ctx: SequenceAIContext): SequenceAIPlan {
  const target = intent.targetEngine ?? "usageExamples";
  const policy = SEQUENCE_AI_TOOL_POLICIES.find((p) => p.engineId === target);

  const blocked: string[] = [];
  let primary = target;
  if (policy?.requiredMode === "FOUNDER" && !ctx.founderActive) {
    blocked.push(target);
    primary = "usageExamples";
  }

  const supporting = (SUPPORTING_MAP[primary] ?? []).filter((id) => ctx.availableEngines.includes(id));
  const validation = (VALIDATION_MAP[primary] ?? VALIDATION_MAP.default).filter((id) => ctx.availableEngines.includes(id));
  const exportOptions = EXPORT_MAP[primary] ?? EXPORT_MAP.default;

  const steps: string[] = [];
  steps.push(`解析意图：${intent.intent}（置信度 ${(intent.confidence * 100).toFixed(0)}%）`);
  steps.push(`读取上下文：${ctx.subjectMode} · ${ctx.language} · ${ctx.userLevel}`);
  steps.push(`调用主引擎：${labelOf(primary)}`);
  if (supporting.length) steps.push(`协同引擎：${supporting.map(labelOf).join(" · ")}`);
  steps.push(`回验引擎：${validation.map(labelOf).join(" · ")}`);
  if (exportOptions.length) steps.push(`可导出：${exportOptions.join(" / ")}`);

  let reason = blocked.length
    ? "目标引擎需要 Founder Mode，已降级到示例库引导。"
    : `根据意图与对象类型，主要由 ${labelOf(primary)} 承担。`;

  return {
    primaryEngine: primary,
    supportingEngines: supporting,
    validationEngines: validation,
    exportOptions,
    blockedEngines: blocked,
    executionSteps: steps,
    reason,
  };
}

function labelOf(id: string): string {
  return SEQUENCE_AI_TOOL_POLICIES.find((p: SequenceAIToolPolicy) => p.engineId === id)?.userVisibleName ?? id;
}
