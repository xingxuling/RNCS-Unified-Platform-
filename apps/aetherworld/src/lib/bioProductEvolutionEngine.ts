// 生物产品自进化计算引擎
import { loadMemory } from "./localEvolutionMemory";
import { resolveStage, type EvolutionStageDef } from "@/constants/evolutionStages";

export interface BioEvolutionScoreBreakdown {
  usageFrequency: number;
  feedbackQuality: number;
  predictionValidation: number;
  featureAffinity: number;
  languagePreference: number;
  eventRelevance: number;
  localMemoryStability: number;
  userGoalAlignment: number;
  recalculationConsistency: number;
  noise: number;
  overfitting: number;
  featureBloat: number;
  safetyRisk: number;
  unconfirmedMutation: number;
}

export interface BioEvolutionResult {
  score: number;
  stage: EvolutionStageDef;
  breakdown: BioEvolutionScoreBreakdown;
  signalCount: number;
  validatedEventCount: number;
  topFeatures: { moduleId: string; affinity: number }[];
  topEvents: { eventTypeId: string; affinity: number }[];
  topPrompts: { templateId: string; effectiveness: number }[];
}

const clamp = (n: number, lo = 0.1, hi = 10) => Math.max(lo, Math.min(hi, n));

export function computeBioEvolution(): BioEvolutionResult {
  const mem = loadMemory();
  const signals = mem.signals;
  const validated = signals.filter(s => s.type === "EVENT_VALIDATED").length;
  const wrong = signals.filter(s => s.type === "EVENT_WRONG").length;
  const feedback = signals.filter(s => s.type === "FEEDBACK_SUBMITTED").length;
  const skipped = signals.filter(s => s.type === "FEEDBACK_SKIPPED" || s.type === "QUICK_EXIT").length;

  const usageFrequency = clamp(1 + Math.log10(signals.length + 1));
  const feedbackQuality = clamp(1 + feedback * 0.1 + validated * 0.2);
  const predictionValidation = clamp(1 + validated * 0.15);
  const featureAffinity = clamp(1 + Object.keys(mem.featureAffinity).length * 0.05);
  const languagePreference = clamp(0.8 + (mem.languagePreference === "BEGINNER" ? 0.2 : 0.4));
  const eventRelevance = clamp(1 + Object.keys(mem.eventAffinity).length * 0.05);
  const localMemoryStability = clamp(1 + (mem.signals.length > 50 ? 0.5 : 0));
  const userGoalAlignment = clamp(1 + mem.feedbackReliability);
  const recalculationConsistency = clamp(1 + signals.filter(s => s.type === "RECALCULATION_RUN").length * 0.05);

  const noise = clamp(1 + skipped * 0.05);
  const overfitting = clamp(1 + Math.max(0, mem.preferredModules.length - 6) * 0.1);
  const featureBloat = clamp(1 + Math.max(0, Object.keys(mem.featureAffinity).length - 20) * 0.05);
  const safetyRisk = clamp(1 + wrong * 0.05);
  const unconfirmedMutation = 1; // tracked externally via mutation queue

  const numerator =
    usageFrequency * feedbackQuality * predictionValidation * featureAffinity *
    languagePreference * eventRelevance * localMemoryStability * userGoalAlignment * recalculationConsistency;
  const denominator = noise * overfitting * featureBloat * safetyRisk * unconfirmedMutation;
  const score = Math.round((numerator / denominator) * 10) / 10;

  const stage = resolveStage(signals.length, validated);

  const topFeatures = Object.entries(mem.featureAffinity)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([moduleId, affinity]) => ({ moduleId, affinity: Math.round(affinity * 10) / 10 }));
  const topEvents = Object.entries(mem.eventAffinity)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([eventTypeId, affinity]) => ({ eventTypeId, affinity: Math.round(affinity * 10) / 10 }));
  const topPrompts = Object.entries(mem.promptEffectiveness)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([templateId, effectiveness]) => ({ templateId, effectiveness }));

  return {
    score,
    stage,
    breakdown: {
      usageFrequency, feedbackQuality, predictionValidation, featureAffinity,
      languagePreference, eventRelevance, localMemoryStability, userGoalAlignment,
      recalculationConsistency, noise, overfitting, featureBloat, safetyRisk, unconfirmedMutation,
    },
    signalCount: signals.length,
    validatedEventCount: validated,
    topFeatures, topEvents, topPrompts,
  };
}
