import type { SequenceCoreProfile } from "../sequenceCoreEngine";
import { DIGIT_CAMERA_HINTS, type CameraShotType } from "@/constants/sequence-world/presentation/cameraLanguageTypes";

export interface CameraShot {
  shotType: CameraShotType;
  useCase: string;
  movement: string;
  emotionalMeaning: string;
}

export interface EventCameraRule {
  eventType: string;
  shotType: CameraShotType;
  rationale: string;
}

export interface CameraLanguageProfile {
  defaultCameraMode: CameraShotType;
  cameraRhythm: string;
  shotTypes: CameraShot[];
  transitionStyle: string;
  eventCameraRules: EventCameraRule[];
  cinematicRisk: number;
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export function generateCameraLanguage(core: SequenceCoreProfile): CameraLanguageProfile {
  const top = core.dominantDigits[0] ?? "5";
  const t = DIGIT_CAMERA_HINTS[top];
  const f = core.digitFrequency;
  const total = Object.values(f).reduce((s, n) => s + n, 0) || 1;

  const shotTypes: CameraShot[] = core.dominantDigits.map(d => {
    const h = DIGIT_CAMERA_HINTS[d];
    return {
      shotType: h?.defaultShot ?? "WIDE_ESTABLISHING",
      useCase: h?.meaning ?? "ambient",
      movement: h?.rhythm ?? "still",
      emotionalMeaning: h?.meaning ?? "neutral",
    };
  });

  return {
    defaultCameraMode: t?.defaultShot ?? "WIDE_ESTABLISHING",
    cameraRhythm: t?.rhythm ?? "balanced",
    shotTypes,
    transitionStyle: t?.transition ?? "soft_cut",
    eventCameraRules: [
      { eventType: "CONFLICT", shotType: "FAST_CUT", rationale: "提高紧张感" },
      { eventType: "RITUAL", shotType: "SLOW_ORBIT", rationale: "仪式氛围" },
      { eventType: "DISCOVERY", shotType: "WIDE_ESTABLISHING", rationale: "建立世界感" },
      { eventType: "TERMINAL", shotType: "GOD_VIEW", rationale: "终局视角" },
    ],
    cinematicRisk: clamp01(((f["5"] ?? 0) + (f["9"] ?? 0)) / total),
  };
}
