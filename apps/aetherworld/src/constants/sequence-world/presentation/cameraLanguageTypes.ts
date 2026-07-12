export const CAMERA_SHOT_TYPES = [
  "WIDE_ESTABLISHING", "CLOSE_UP", "SLOW_ORBIT", "FAST_CUT",
  "TOP_DOWN_MAP", "FIRST_PERSON", "OVER_SHOULDER", "GOD_VIEW",
  "TERMINAL_VIEW", "MEMORY_FLASH",
] as const;
export type CameraShotType = typeof CAMERA_SHOT_TYPES[number];

export interface CameraLanguageHint {
  digit: string;
  defaultShot: CameraShotType;
  rhythm: string;
  transition: string;
  meaning: string;
}

export const DIGIT_CAMERA_HINTS: Record<string, CameraLanguageHint> = {
  "0": { digit: "0", defaultShot: "WIDE_ESTABLISHING", rhythm: "still", transition: "black_cut", meaning: "空镜、黑场" },
  "1": { digit: "1", defaultShot: "CLOSE_UP", rhythm: "deliberate", transition: "snap_in", meaning: "中心构图、主权" },
  "2": { digit: "2", defaultShot: "OVER_SHOULDER", rhythm: "alternating", transition: "soft_cut", meaning: "关系切换" },
  "3": { digit: "3", defaultShot: "TERMINAL_VIEW", rhythm: "info_flow", transition: "ui_wipe", meaning: "符号/界面叠加" },
  "4": { digit: "4", defaultShot: "TOP_DOWN_MAP", rhythm: "grid", transition: "structural_pan", meaning: "俯视、规则" },
  "5": { digit: "5", defaultShot: "FAST_CUT", rhythm: "rapid", transition: "whip_pan", meaning: "快切、动态" },
  "6": { digit: "6", defaultShot: "SLOW_ORBIT", rhythm: "breath", transition: "ease_push", meaning: "柔和推拉、生活感" },
  "7": { digit: "7", defaultShot: "MEMORY_FLASH", rhythm: "elusive", transition: "blur_fade", meaning: "梦境、遮挡" },
  "8": { digit: "8", defaultShot: "CLOSE_UP", rhythm: "low_angle", transition: "weighted_dolly", meaning: "厚重低角度" },
  "9": { digit: "9", defaultShot: "GOD_VIEW", rhythm: "ritual", transition: "orbital_halo", meaning: "神视角、星海" },
};
