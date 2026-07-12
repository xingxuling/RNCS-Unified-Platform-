import { classifySequenceAIIntent, type SequenceAIIntentResult } from "./sequenceAIIntentClassifier";
import { buildSequenceAIContext, type SequenceAIContext, type SequenceAISubjectMode } from "./sequenceAIContextBuilder";
import { planEngines, type SequenceAIPlan } from "./sequenceAIEnginePlanner";
import { runSafetyGovernor, type SafetyVerdict } from "./sequenceAISafetyGovernor";
import { composeSequenceAIResponse, type SequenceAIResponse } from "./sequenceAIResponseComposer";
import { appendSequenceAIMemory } from "./sequenceAIMemory";
import { logTrace, summarizeTraces } from "./sequenceAITraceLogger";

export interface RunSequenceAIInput {
  userInput: string;
  founderActive?: boolean;
  beginnerMode?: boolean;
  language?: string;
  currentRoute?: string;
  subjectMode?: SequenceAISubjectMode;
  activeSequenceSummary?: string;
  persist?: boolean;
}

export interface SequenceAIRunResult {
  intent: SequenceAIIntentResult;
  context: SequenceAIContext;
  plan: SequenceAIPlan;
  safety: SafetyVerdict;
  response: SequenceAIResponse;
}

export function runSequenceAI(input: RunSequenceAIInput): SequenceAIRunResult {
  const intent = classifySequenceAIIntent(input.userInput);
  logTrace("INTENT", `${intent.intent} (${intent.confidence.toFixed(2)})`, intent);

  const context = buildSequenceAIContext({
    founderActive: input.founderActive,
    beginnerMode: input.beginnerMode,
    language: input.language,
    currentRoute: input.currentRoute,
    subjectMode: input.subjectMode,
    activeSequenceSummary: input.activeSequenceSummary,
  });
  logTrace("CONTEXT", `${context.subjectMode} · ${context.userLevel}`, context);

  const plan = planEngines(intent, context);
  logTrace("PLAN", `primary=${plan.primaryEngine}`, plan);

  const draft = `${intent.intent} ${intent.topic}`;
  const safety = runSafetyGovernor(input.userInput, draft, intent, context);
  logTrace("SAFETY", `severity=${safety.highestSeverity}`, safety);

  const response = composeSequenceAIResponse(intent, context, plan, safety);
  logTrace("RESPONSE", summarizeTraces(intent, plan, safety));

  if (input.persist !== false) {
    appendSequenceAIMemory({
      id: `sai_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      subjectMode: context.subjectMode,
      userInput: input.userInput,
      intent: intent.intent,
      plan,
      responseSummary: response.plainAnswer.slice(0, 200),
      generatedAssetIds: response.generatedAssets.map((a) => a.id),
    });
  }

  return { intent, context, plan, safety, response };
}
