export interface SemanticPhysicsHint {
  digit: string;
  motion: string;
  forceWeights: Partial<{
    resistance: number; eventMomentum: number; recoveryForce: number;
    relationAttraction: number; entropyDrift: number; phaseShiftChance: number;
  }>;
  gravity: string;
}
export const DIGIT_PHYSICS_HINTS: Record<string, SemanticPhysicsHint> = {
  "0": { digit:"0", motion:"damped/frozen", forceWeights:{ resistance:0.9, eventMomentum:0.1, recoveryForce:0.2 }, gravity:"null/void" },
  "1": { digit:"1", motion:"directional thrust", forceWeights:{ eventMomentum:0.7, recoveryForce:0.4 }, gravity:"center-pull" },
  "2": { digit:"2", motion:"orbital coupling", forceWeights:{ relationAttraction:0.8 }, gravity:"pair-attraction" },
  "3": { digit:"3", motion:"wave/diffusion", forceWeights:{ eventMomentum:0.5, entropyDrift:0.4 }, gravity:"signal-spread" },
  "4": { digit:"4", motion:"bounded/grid", forceWeights:{ resistance:0.7, phaseShiftChance:0.1 }, gravity:"rule-wall" },
  "5": { digit:"5", motion:"burst/turn", forceWeights:{ eventMomentum:0.9, phaseShiftChance:0.7 }, gravity:"wind-shear" },
  "6": { digit:"6", motion:"breathing/recover", forceWeights:{ recoveryForce:0.9, resistance:0.3 }, gravity:"bio-cushion" },
  "7": { digit:"7", motion:"hidden drag", forceWeights:{ resistance:0.5, entropyDrift:0.5 }, gravity:"unseen-pull" },
  "8": { digit:"8", motion:"heavy convergence", forceWeights:{ relationAttraction:0.7, resistance:0.6 }, gravity:"resource-well" },
  "9": { digit:"9", motion:"ritual collapse", forceWeights:{ eventMomentum:0.4, phaseShiftChance:0.3, recoveryForce:0.3 }, gravity:"end-state convergence" },
};
