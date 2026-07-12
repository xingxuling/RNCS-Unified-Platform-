// 常数宇宙 v1.0 · 用户常数
export type UserTypeId =
  | "DEMO_VISITOR" | "LIGHT_USER" | "FULL_SUBJECT_USER" | "CREATOR_USER"
  | "RESEARCH_USER" | "ENTERPRISE_USER" | "BETA_TESTER" | "ADMIN_FOUNDER"
  | "MOBILE_CASUAL_USER" | "POWER_USER";

export type LanguageLevel = "USER" | "PROFESSIONAL" | "SYSTEM";
export type UIDensity = "LOW" | "MEDIUM" | "HIGH";
export type SafetyLevel = "LOW" | "MEDIUM" | "HIGH" | "MAX";

export interface UserConstant {
  id: UserTypeId;
  name: string;
  defaultLanguageLevel: LanguageLevel;
  defaultUIDensity: UIDensity;
  allowedModules: string[];
  hiddenModules: string[];
  safetyLevel: SafetyLevel;
  onboardingNeed: "LOW" | "MEDIUM" | "HIGH";
  feedbackNeed: "LOW" | "MEDIUM" | "HIGH";
  maxCognitiveLoad: number; // 1-10
  defaultHome: string;
}

export const USER_CONSTANTS: UserConstant[] = [
  { id: "DEMO_VISITOR",      name: "Demo 访客",       defaultLanguageLevel: "USER",         defaultUIDensity: "LOW",    allowedModules: ["onboarding","docs","calendar"], hiddenModules: ["founder-console","founder-permissions","event-library-audit"], safetyLevel: "MAX",    onboardingNeed: "HIGH", feedbackNeed: "LOW",  maxCognitiveLoad: 3, defaultHome: "/onboarding" },
  { id: "LIGHT_USER",        name: "轻度用户(20项)",  defaultLanguageLevel: "USER",         defaultUIDensity: "LOW",    allowedModules: ["*"], hiddenModules: ["founder-console","founder-permissions"], safetyLevel: "HIGH",   onboardingNeed: "MEDIUM", feedbackNeed: "MEDIUM", maxCognitiveLoad: 4, defaultHome: "/" },
  { id: "FULL_SUBJECT_USER", name: "完整主体(60项)",  defaultLanguageLevel: "USER",         defaultUIDensity: "MEDIUM", allowedModules: ["*"], hiddenModules: ["founder-console","founder-permissions"], safetyLevel: "MEDIUM", onboardingNeed: "MEDIUM", feedbackNeed: "HIGH",   maxCognitiveLoad: 6, defaultHome: "/" },
  { id: "CREATOR_USER",      name: "创作者",          defaultLanguageLevel: "PROFESSIONAL", defaultUIDensity: "MEDIUM", allowedModules: ["*"], hiddenModules: ["founder-console","founder-permissions"], safetyLevel: "MEDIUM", onboardingNeed: "LOW",    feedbackNeed: "HIGH",   maxCognitiveLoad: 7, defaultHome: "/prompt-forge" },
  { id: "RESEARCH_USER",     name: "研究者",          defaultLanguageLevel: "PROFESSIONAL", defaultUIDensity: "HIGH",   allowedModules: ["*"], hiddenModules: ["founder-console","founder-permissions"], safetyLevel: "LOW",    onboardingNeed: "LOW",    feedbackNeed: "HIGH",   maxCognitiveLoad: 9, defaultHome: "/event-library-audit" },
  { id: "ENTERPRISE_USER",   name: "企业用户",        defaultLanguageLevel: "PROFESSIONAL", defaultUIDensity: "MEDIUM", allowedModules: ["*"], hiddenModules: ["founder-console","founder-permissions"], safetyLevel: "HIGH",   onboardingNeed: "MEDIUM", feedbackNeed: "MEDIUM", maxCognitiveLoad: 6, defaultHome: "/" },
  { id: "BETA_TESTER",       name: "内测用户",        defaultLanguageLevel: "PROFESSIONAL", defaultUIDensity: "HIGH",   allowedModules: ["*"], hiddenModules: ["founder-console","founder-permissions"], safetyLevel: "MEDIUM", onboardingNeed: "LOW",    feedbackNeed: "HIGH",   maxCognitiveLoad: 8, defaultHome: "/beta-launch" },
  { id: "ADMIN_FOUNDER",     name: "创始人",          defaultLanguageLevel: "SYSTEM",       defaultUIDensity: "HIGH",   allowedModules: ["*"], hiddenModules: [], safetyLevel: "LOW", onboardingNeed: "LOW", feedbackNeed: "HIGH", maxCognitiveLoad: 10, defaultHome: "/founder-console" },
  { id: "MOBILE_CASUAL_USER",name: "移动随手用户",    defaultLanguageLevel: "USER",         defaultUIDensity: "LOW",    allowedModules: ["calendar","feedback","docs"], hiddenModules: ["founder-console","founder-permissions","event-library-audit"], safetyLevel: "HIGH", onboardingNeed: "HIGH", feedbackNeed: "LOW",  maxCognitiveLoad: 3, defaultHome: "/calendar" },
  { id: "POWER_USER",        name: "高级用户",        defaultLanguageLevel: "PROFESSIONAL", defaultUIDensity: "HIGH",   allowedModules: ["*"], hiddenModules: ["founder-console","founder-permissions"], safetyLevel: "MEDIUM", onboardingNeed: "LOW", feedbackNeed: "HIGH", maxCognitiveLoad: 9, defaultHome: "/advanced-core" },
];

export const getUserConstant = (id: UserTypeId) =>
  USER_CONSTANTS.find((u) => u.id === id);
