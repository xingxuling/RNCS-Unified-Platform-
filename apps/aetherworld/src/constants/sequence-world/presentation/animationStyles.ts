export interface AnimationStyleHint {
  digit: string;
  movementStyle: string;
  idle: string;
  transition: string;
  intensity: number;
}

export const DIGIT_ANIMATION_STYLES: Record<string, AnimationStyleHint> = {
  "0": { digit: "0", movementStyle: "frozen_fade", idle: "still", transition: "slow_fade", intensity: 0.1 },
  "1": { digit: "1", movementStyle: "linear_thrust", idle: "stance_authority", transition: "snap", intensity: 0.7 },
  "2": { digit: "2", movementStyle: "sync_interact", idle: "two_face", transition: "soft_blend", intensity: 0.4 },
  "3": { digit: "3", movementStyle: "gesture_unfold", idle: "ambient_glyph", transition: "rune_flow", intensity: 0.5 },
  "4": { digit: "4", movementStyle: "mechanical_stable", idle: "guard_stance", transition: "grid_step", intensity: 0.4 },
  "5": { digit: "5", movementStyle: "fast_burst", idle: "ready_tension", transition: "snap_turn", intensity: 0.9 },
  "6": { digit: "6", movementStyle: "breathing_soft", idle: "calm_breath", transition: "ease_recover", intensity: 0.3 },
  "7": { digit: "7", movementStyle: "stealth_drift", idle: "observe", transition: "ghost_fade", intensity: 0.3 },
  "8": { digit: "8", movementStyle: "heavy_weight", idle: "anchored", transition: "weighted_step", intensity: 0.5 },
  "9": { digit: "9", movementStyle: "ritual_slow", idle: "ceremonial", transition: "halo_blend", intensity: 0.6 },
};
