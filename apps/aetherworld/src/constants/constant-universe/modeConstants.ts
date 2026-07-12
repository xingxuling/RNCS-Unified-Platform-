// Constant Universe v0.2 — Mode Constants
export type SubjectModeId = "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";

export interface ModeConstant {
  modeId: SubjectModeId;
  chineseName: string;
  personalizationDepth: number;
  privacyLevel: "PUBLIC_DEMO" | "LOCAL_PRIVATE" | "FOUNDER_PRIVATE";
  canExportPrivate: boolean;
  exportWarningLevel: "NONE" | "WARNING" | "STRONG_WARNING" | "CONFIRMATION";
  traceVisible: boolean;
}

export const MODE_CONSTANTS: Record<SubjectModeId, ModeConstant> = {
  DEMO: {
    modeId: "DEMO", chineseName: "Demo 演示",
    personalizationDepth: 0.1, privacyLevel: "PUBLIC_DEMO",
    canExportPrivate: false, exportWarningLevel: "NONE", traceVisible: false,
  },
  LIGHT_20: {
    modeId: "LIGHT_20", chineseName: "Light20 轻量真实",
    personalizationDepth: 0.55, privacyLevel: "LOCAL_PRIVATE",
    canExportPrivate: true, exportWarningLevel: "WARNING", traceVisible: false,
  },
  FULL_60: {
    modeId: "FULL_60", chineseName: "Full60 深度真实",
    personalizationDepth: 0.95, privacyLevel: "LOCAL_PRIVATE",
    canExportPrivate: true, exportWarningLevel: "STRONG_WARNING", traceVisible: false,
  },
  FOUNDER: {
    modeId: "FOUNDER", chineseName: "Founder 创世",
    personalizationDepth: 1.0, privacyLevel: "FOUNDER_PRIVATE",
    canExportPrivate: true, exportWarningLevel: "CONFIRMATION", traceVisible: true,
  },
};
