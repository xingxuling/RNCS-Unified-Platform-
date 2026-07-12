// 信号收集器 Evolution Signal Collector
import { EVOLUTION_SIGNAL_TYPES, getSignalDef, type EvolutionSignal } from "@/constants/evolutionSignals";
import { loadMemory, saveMemory } from "./localEvolutionMemory";

export function recordSignal(input: Omit<EvolutionSignal, "id" | "timestamp" | "weight"> & { weight?: number }) {
  const def = getSignalDef(input.type);
  const sig: EvolutionSignal = {
    id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    weight: input.weight ?? def?.weight ?? 0.5,
    ...input,
  };
  const mem = loadMemory();
  mem.signals.push(sig);

  if (sig.moduleId) {
    mem.featureAffinity[sig.moduleId] = (mem.featureAffinity[sig.moduleId] ?? 0) + sig.weight;
  }
  if (sig.eventTypeId) {
    mem.eventAffinity[sig.eventTypeId] = (mem.eventAffinity[sig.eventTypeId] ?? 0) + sig.weight;
  }
  if (sig.type === "FEEDBACK_SUBMITTED" || sig.type === "EVENT_VALIDATED") {
    mem.feedbackReliability = Math.min(1, mem.feedbackReliability + 0.02);
  }
  if (sig.type === "FEEDBACK_SKIPPED" || sig.type === "EVENT_WRONG") {
    mem.feedbackReliability = Math.max(0, mem.feedbackReliability - 0.01);
  }
  if (sig.type === "PROMPT_MARKED_EFFECTIVE" && sig.metadata?.templateId) {
    const t = sig.metadata.templateId as string;
    mem.promptEffectiveness[t] = (mem.promptEffectiveness[t] ?? 0) + 1;
  }
  saveMemory(mem);
  return sig;
}

export function getSignalTypes() { return EVOLUTION_SIGNAL_TYPES; }
