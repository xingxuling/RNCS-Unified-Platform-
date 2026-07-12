// UI Update Engine — User Modes
export type UIUserMode = "PLAIN_USER" | "STRUCTURED_USER" | "DEVELOPER_USER" | "CREATOR_USER" | "FOUNDER_USER";

export interface UIUserModeDefinition {
  id: UIUserMode;
  chineseName: string;
  englishName: string;
  permissionTier: "PUBLIC" | "ADVANCED" | "FOUNDER";
  showsTrace: boolean;
  showsConstants: boolean;
  showsConstitution: boolean;
  vocabulary: "PLAIN" | "STRUCTURED" | "TECHNICAL" | "CREATIVE" | "SYSTEM";
}

export const UI_USER_MODES: UIUserModeDefinition[] = [
  { id: "PLAIN_USER",      chineseName: "普通用户",   englishName: "Plain User",      permissionTier: "PUBLIC",   showsTrace: false, showsConstants: false, showsConstitution: false, vocabulary: "PLAIN" },
  { id: "STRUCTURED_USER", chineseName: "结构用户",   englishName: "Structured User", permissionTier: "ADVANCED", showsTrace: false, showsConstants: true,  showsConstitution: false, vocabulary: "STRUCTURED" },
  { id: "DEVELOPER_USER",  chineseName: "开发者",     englishName: "Developer",       permissionTier: "ADVANCED", showsTrace: true,  showsConstants: true,  showsConstitution: false, vocabulary: "TECHNICAL" },
  { id: "CREATOR_USER",    chineseName: "创作者",     englishName: "Creator",         permissionTier: "ADVANCED", showsTrace: false, showsConstants: false, showsConstitution: false, vocabulary: "CREATIVE" },
  { id: "FOUNDER_USER",    chineseName: "Founder",    englishName: "Founder",         permissionTier: "FOUNDER",  showsTrace: true,  showsConstants: true,  showsConstitution: true,  vocabulary: "SYSTEM" },
];
