export interface UIMotionHint {
  digit: string;
  density: "LOW" | "MEDIUM" | "HIGH";
  motionStyle: string;
  buttonFeedback: string;
  panelTransition: string;
}

export const DIGIT_UI_MOTION_HINTS: Record<string, UIMotionHint> = {
  "0": { digit: "0", density: "LOW", motionStyle: "minimal_dark", buttonFeedback: "subtle_dim", panelTransition: "fade" },
  "1": { digit: "1", density: "MEDIUM", motionStyle: "clear_central", buttonFeedback: "strong_pulse", panelTransition: "snap" },
  "2": { digit: "2", density: "MEDIUM", motionStyle: "linked_soft", buttonFeedback: "connection_glow", panelTransition: "ease_link" },
  "3": { digit: "3", density: "HIGH", motionStyle: "text_flow", buttonFeedback: "label_pop", panelTransition: "wipe" },
  "4": { digit: "4", density: "MEDIUM", motionStyle: "grid_structured", buttonFeedback: "card_press", panelTransition: "slide_grid" },
  "5": { digit: "5", density: "HIGH", motionStyle: "fast_dynamic", buttonFeedback: "spark", panelTransition: "snap_blur" },
  "6": { digit: "6", density: "LOW", motionStyle: "soft_recovery", buttonFeedback: "soft_glow", panelTransition: "ease_breath" },
  "7": { digit: "7", density: "LOW", motionStyle: "hidden_reveal", buttonFeedback: "fade_in", panelTransition: "fog_reveal" },
  "8": { digit: "8", density: "MEDIUM", motionStyle: "heavy_card", buttonFeedback: "metallic_click", panelTransition: "weighted_slide" },
  "9": { digit: "9", density: "LOW", motionStyle: "ritual_unfold", buttonFeedback: "halo_pulse", panelTransition: "slow_halo" },
};
