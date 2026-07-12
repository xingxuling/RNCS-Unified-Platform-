import type { SequenceAISubjectMode } from "@/lib/sequence-ai/sequenceAIContextBuilder";
import { normalizeFreeInput, type NormalizedFreeInput } from "./freeInputNormalizer";
import { extractFreeIntents, type FreeIntentExtraction } from "./freeIntentExtractor";
import { splitFreeTasks, type FreeTaskPlan } from "./freeTaskSplitter";
import { resolveAmbiguity, type AmbiguityResolution } from "./freeAmbiguityResolver";
import { routeFreeEngines, type FreeEngineRoute } from "./freeEngineRouter";
import { planFreeAnswer, type FreeAnswerPlan } from "./freeAnswerPlanner";
import { runFreeInputSafety, type FreeInputSafetyResult } from "./freeInputSafetyGuard";
import { composeFreeAnswer, type FreeAnswer } from "./freeAnswerComposer";
import { appendFreeInputMemory } from "./freeInputMemory";

export interface RunFreeInputOptions {
  founderActive?: boolean;
  beginnerMode?: boolean;
  subjectMode?: SequenceAISubjectMode;
  language?: string;
  persist?: boolean;
}

export interface FreeInputRunResult {
  normalized: NormalizedFreeInput;
  intents: FreeIntentExtraction;
  taskPlan: FreeTaskPlan;
  ambiguity: AmbiguityResolution;
  route: FreeEngineRoute;
  plan: FreeAnswerPlan;
  safety: FreeInputSafetyResult;
  answer: FreeAnswer;
}

export function runFreeInputEngine(rawInput: string, opts: RunFreeInputOptions = {}): FreeInputRunResult {
  const subjectMode = opts.subjectMode ?? (opts.founderActive ? "FOUNDER" : "DEMO");
  const beginnerMode = opts.beginnerMode ?? !opts.founderActive;
  const language =
    opts.language ?? (typeof window !== "undefined" ? (localStorage.getItem("aether.lang") ?? "zh-CN") : "zh-CN");

  const normalized = normalizeFreeInput(rawInput);
  const intents = extractFreeIntents(normalized);
  const taskPlan = splitFreeTasks(normalized);
  const ambiguity = resolveAmbiguity(normalized);
  const route = routeFreeEngines(normalized, taskPlan);
  const plan = planFreeAnswer(normalized, intents, route);
  const safety = runFreeInputSafety(normalized.cleanedText, subjectMode);
  const answer = composeFreeAnswer(normalized, plan, taskPlan, route, ambiguity, safety, {
    founderActive: !!opts.founderActive,
    beginnerMode,
    subjectMode,
    language,
  });

  if (opts.persist !== false) {
    appendFreeInputMemory({
      id: `free_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      rawInput,
      normalizedInput: normalized,
      taskPlan,
      answerSummary: answer.answer.slice(0, 240),
      subjectMode,
      language,
    });
  }

  return { normalized, intents, taskPlan, ambiguity, route, plan, safety, answer };
}
