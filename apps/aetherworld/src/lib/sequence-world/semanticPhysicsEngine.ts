// Semantic Physics Engine
import type { SequenceCoreProfile } from "./sequenceCoreEngine";
import { DIGIT_PHYSICS_HINTS } from "@/constants/sequence-world/semanticPhysicsTypes";

export interface SemanticPhysicsProfile {
  motionBias: string;
  resistance: number;
  eventMomentum: number;
  collapseThreshold: number;
  recoveryForce: number;
  gravityType: string;
  relationAttraction: number;
  entropyDrift: number;
  phaseShiftChance: number;
  physicsDescription: string;
}

function clamp(n: number) { return Math.max(0, Math.min(1, n)); }

export function generateSemanticPhysics(core: SequenceCoreProfile): SemanticPhysicsProfile {
  const f = core.digitFrequency;
  const total = Object.values(f).reduce((s, n) => s + n, 0) || 1;

  const acc = { resistance: 0, eventMomentum: 0, recoveryForce: 0, relationAttraction: 0, entropyDrift: 0, phaseShiftChance: 0 };
  Object.entries(f).forEach(([d, n]) => {
    const h = DIGIT_PHYSICS_HINTS[d];
    if (!h) return;
    const w = n / total;
    Object.entries(h.forceWeights).forEach(([k, v]) => {
      (acc as Record<string, number>)[k] = ((acc as Record<string, number>)[k] ?? 0) + (v ?? 0) * w * 2;
    });
  });

  const top = core.dominantDigits[0] ?? "5";
  const topHint = DIGIT_PHYSICS_HINTS[top];

  // collapseThreshold: 0 与 9 高 → 容易坍缩到 end-state
  const collapseThreshold = clamp(0.3 + (f["0"] ?? 0) / total + (f["9"] ?? 0) / total * 0.8);

  const motionBias = topHint?.motion ?? "balanced flow";
  const gravityType = topHint?.gravity ?? "balanced gravity";

  const physicsDescription =
    `世界倾向「${motionBias}」运动，主引力为「${gravityType}」。` +
    `阻尼 ${(acc.resistance * 100).toFixed(0)}%，事件动量 ${(acc.eventMomentum * 100).toFixed(0)}%，` +
    `恢复力 ${(acc.recoveryForce * 100).toFixed(0)}%，相变概率 ${(acc.phaseShiftChance * 100).toFixed(0)}%。`;

  return {
    motionBias,
    resistance: clamp(acc.resistance),
    eventMomentum: clamp(acc.eventMomentum),
    collapseThreshold,
    recoveryForce: clamp(acc.recoveryForce),
    gravityType,
    relationAttraction: clamp(acc.relationAttraction),
    entropyDrift: clamp(acc.entropyDrift),
    phaseShiftChance: clamp(acc.phaseShiftChance),
    physicsDescription,
  };
}
