// World State Machine — 世界状态机
import { WORLD_PHASES, DEFAULT_TRANSITIONS, type WorldPhaseId, type WorldStateTransition } from "@/constants/sequence-world/simulation/worldPhases";

export interface PhaseEvaluationInput {
  currentPhase: WorldPhaseId;
  dominantDigits: string[];
  eventPressure: number;
  causalDensity: number;
  resourcePressure: number;
}

export interface PhaseTransitionResult {
  nextPhase: WorldPhaseId;
  triggered?: WorldStateTransition;
  reason: string;
}

export function listPhases() { return WORLD_PHASES; }
export function listTransitions() { return DEFAULT_TRANSITIONS; }

export function evaluateNextPhase(input: PhaseEvaluationInput): PhaseTransitionResult {
  // 过载优先
  if (input.eventPressure > 0.85 || input.causalDensity > 50) {
    return { nextPhase: "OVERLOAD", reason: "事件压力或因果密度超载" };
  }
  const candidates = DEFAULT_TRANSITIONS.filter(t => t.from === input.currentPhase);
  for (const t of candidates) {
    if (!t.requiredDigits || t.requiredDigits.some(d => input.dominantDigits.includes(d))) {
      return { nextPhase: t.to, triggered: t, reason: t.trigger };
    }
  }
  return { nextPhase: input.currentPhase, reason: "条件未触发，保持当前相位" };
}
