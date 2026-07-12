import type { SequenceCoreProfile } from "../sequenceCoreEngine";
import { DIGIT_UI_MOTION_HINTS } from "@/constants/sequence-world/presentation/uiMotionTypes";

export interface UIMotionProfile {
  uiDensity: "LOW" | "MEDIUM" | "HIGH";
  motionStyle: string;
  buttonFeedback: string;
  panelTransition: string;
  alertStyle: string;
  terminalMotion: string;
  reducedMotionSupported: boolean;
  accessibilityNotes: string[];
}

export function generateUIMotion(core: SequenceCoreProfile): UIMotionProfile {
  const top = core.dominantDigits[0] ?? "5";
  const h = DIGIT_UI_MOTION_HINTS[top];
  const f = core.digitFrequency;
  const total = Object.values(f).reduce((s, n) => s + n, 0) || 1;
  const densityHigh = (f["3"] ?? 0) / total > 0.25;
  const density: UIMotionProfile["uiDensity"] = densityHigh ? "HIGH" : (h?.density ?? "MEDIUM");

  return {
    uiDensity: density,
    motionStyle: h?.motionStyle ?? "balanced",
    buttonFeedback: h?.buttonFeedback ?? "soft_pulse",
    panelTransition: h?.panelTransition ?? "ease",
    alertStyle: top === "5" ? "pulse_attention" : "soft_notice",
    terminalMotion: "type_in",
    reducedMotionSupported: true,
    accessibilityNotes: [
      "支持 prefers-reduced-motion",
      "动效不可影响可用性",
      "避免不可关闭的闪烁",
    ],
  };
}
