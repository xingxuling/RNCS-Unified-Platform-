import type { SequenceCoreProfile } from "../sequenceCoreEngine";
import { DIGIT_ANIMATION_STYLES } from "@/constants/sequence-world/presentation/animationStyles";

export interface AnimationState {
  stateId: string;
  name: string;
  loop: boolean;
  speed: number;
  weight: number;
  meaning: string;
}

export interface AnimationTransitionRule {
  from: string;
  to: string;
  condition: string;
  blendTime: number;
}

export interface EventAnimationTrigger {
  eventType: string;
  animationStyle: string;
  intensity: number;
}

export interface UIAnimationTrigger {
  uiEvent: string;
  animation: string;
}

export interface AnimationRuntime {
  movementStyle: string;
  idleAnimations: AnimationState[];
  transitionRules: AnimationTransitionRule[];
  npcAnimationBias: Record<string, string>;
  eventAnimationTriggers: EventAnimationTrigger[];
  uiAnimationTriggers: UIAnimationTrigger[];
  animationIntensity: number;
  overAnimationRisk: number;
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export function generateAnimationRuntime(core: SequenceCoreProfile): AnimationRuntime {
  const top = core.dominantDigits[0] ?? "5";
  const t = DIGIT_ANIMATION_STYLES[top];
  const f = core.digitFrequency;
  const total = Object.values(f).reduce((s, n) => s + n, 0) || 1;
  const intensity = clamp01(
    Object.entries(f).reduce((s, [d, n]) => s + (DIGIT_ANIMATION_STYLES[d]?.intensity ?? 0) * (n / total), 0),
  );
  const overAnimationRisk = clamp01(((f["5"] ?? 0) * 1.5 + (f["3"] ?? 0) * 0.8) / total);

  const idleAnimations: AnimationState[] = core.dominantDigits.map(d => {
    const h = DIGIT_ANIMATION_STYLES[d];
    return {
      stateId: `idle-${d}`,
      name: h?.idle ?? "idle",
      loop: true,
      speed: 0.5 + (h?.intensity ?? 0.4) * 0.5,
      weight: 1,
      meaning: `digit ${d}`,
    };
  });

  const transitionRules: AnimationTransitionRule[] = core.dominantDigits.slice(0, 2).map((d, i, a) => ({
    from: `idle-${d}`,
    to: `idle-${a[(i + 1) % a.length]}`,
    condition: "world_state_change",
    blendTime: 0.4,
  }));

  const npcAnimationBias: Record<string, string> = {};
  core.dominantDigits.forEach(d => { npcAnimationBias[`digit:${d}`] = DIGIT_ANIMATION_STYLES[d]?.movementStyle ?? "neutral"; });

  return {
    movementStyle: t?.movementStyle ?? "balanced",
    idleAnimations,
    transitionRules,
    npcAnimationBias,
    eventAnimationTriggers: [
      { eventType: "CONFLICT", animationStyle: "fast_burst", intensity: 0.8 },
      { eventType: "RITUAL", animationStyle: "ritual_slow", intensity: 0.6 },
      { eventType: "RECOVERY", animationStyle: "breathing_soft", intensity: 0.3 },
    ],
    uiAnimationTriggers: [
      { uiEvent: "panel_open", animation: "ease_in" },
      { uiEvent: "alert", animation: "pulse" },
    ],
    animationIntensity: intensity,
    overAnimationRisk,
  };
}
