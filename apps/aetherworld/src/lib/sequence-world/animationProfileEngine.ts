// Animation Profile Engine
import type { SequenceCoreProfile } from "./sequenceCoreEngine";
import { DIGIT_ANIMATION_HINTS } from "@/constants/sequence-world/animationProfileTypes";

export interface AnimationProfile {
  movementStyle: string;
  idleBehavior: string;
  transitionStyle: string;
  transitionSpeed: number;     // 0-1
  gestureIntensity: number;    // 0-1
  cameraRhythm: string;
  uiMotionStyle: string;
  combatMotionBias?: string;
  animationKeywords: string[];
}

export function generateAnimationProfile(core: SequenceCoreProfile): AnimationProfile {
  const f = core.digitFrequency;
  const total = Object.values(f).reduce((s, n) => s + n, 0) || 1;
  const top = core.dominantDigits[0] ?? "5";
  const second = core.dominantDigits[1] ?? top;
  const topHint = DIGIT_ANIMATION_HINTS[top];
  const secondHint = DIGIT_ANIMATION_HINTS[second];

  const transitionSpeed = Math.min(1, 0.2 + (f["5"] ?? 0) / total * 1.5 + (f["1"] ?? 0) / total * 0.6);
  const gestureIntensity = Math.min(1, 0.2 + (f["3"] ?? 0) / total * 1.2 + (f["2"] ?? 0) / total * 0.5);

  const keywords = new Set<string>();
  [topHint, secondHint].forEach(h => h?.keywords.forEach(k => keywords.add(k)));

  return {
    movementStyle: topHint?.movement ?? "balanced flow",
    idleBehavior: topHint?.idle ?? "neutral idle",
    transitionStyle: secondHint?.transition ?? topHint?.transition ?? "cross-dissolve",
    transitionSpeed: Number(transitionSpeed.toFixed(2)),
    gestureIntensity: Number(gestureIntensity.toFixed(2)),
    cameraRhythm: topHint?.camera ?? "balanced cinematic",
    uiMotionStyle: (f["3"] ?? 0) / total > 0.2 ? "glyph reveal + floating panels" : "subtle fade + slide",
    combatMotionBias: (f["5"] ?? 0) > 0 || (f["1"] ?? 0) > 0 ? "burst + decisive strike" : undefined,
    animationKeywords: Array.from(keywords),
  };
}
