import type { FreeAnswerMode } from "@/constants/free-input/freeAnswerModes";
import type { NormalizedFreeInput } from "./freeInputNormalizer";
import type { FreeEngineRoute } from "./freeEngineRouter";
import type { FreeIntentExtraction } from "./freeIntentExtractor";

export interface FreeAnswerPlan {
  answerMode: FreeAnswerMode;
  primaryEngine: string;
  supportingEngines: string[];
  responseSections: string[];
  nextActionsRequired: boolean;
  validationRequired: boolean;
  safetyRequired: boolean;
  exportOptions: string[];
}

const EXPORTS_BY_ENGINE: Record<string, string[]> = {
  modelGeneration:     ["JSON", "TypeScript", "Zod", "Markdown"],
  sequenceWorldEngine: ["JSON", "Unity", "Godot"],
  narrativeTextEngine: ["Markdown", "JSON"],
  vocalEngine:         ["Suno Prompt", "Udio Prompt", "Markdown"],
  promptForge:         ["Lovable Prompt", "Codex Prompt"],
  translationEngine:   ["JSON", "Markdown"],
  default:             ["Markdown"],
};

export function planFreeAnswer(
  norm: NormalizedFreeInput,
  intents: FreeIntentExtraction,
  route: FreeEngineRoute,
): FreeAnswerPlan {
  let mode: FreeAnswerMode = "DIRECT_ANSWER";
  switch (intents.primary) {
    case "ANALYZE":   mode = "STRUCTURED_ANALYSIS"; break;
    case "PLAN":      mode = "STEP_BY_STEP_PLAN"; break;
    case "GENERATE":  mode = route.primaryEngine === "promptForge" ? "PROMPT_OUTPUT" : "ENGINE_OUTPUT"; break;
    case "MODEL":     mode = "MODEL_OUTPUT"; break;
    case "AUDIT":     mode = "QA_OUTPUT"; break;
    case "TRANSLATE": mode = "ENGINE_OUTPUT"; break;
    case "EXPLAIN":   mode = "DIRECT_ANSWER"; break;
  }
  if (intents.intents.length >= 3) mode = "MIXED_OUTPUT";

  const sections = ["结论", "下一步"];
  if (mode !== "DIRECT_ANSWER") sections.push("结构");
  sections.push("验证点", "安全说明");
  if (route.primaryEngine !== "productEncyclopedia") sections.push("生成资产");

  return {
    answerMode: mode,
    primaryEngine: route.primaryEngine,
    supportingEngines: route.supportingEngines,
    responseSections: sections,
    nextActionsRequired: true,
    validationRequired: true,
    safetyRequired: true,
    exportOptions: EXPORTS_BY_ENGINE[route.primaryEngine] ?? EXPORTS_BY_ENGINE.default,
  };
}
