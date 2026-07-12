// 客户端画像 · Client Profiles
export type UIDensity = "LOW" | "MEDIUM" | "HIGH" | "EXPERT";
export type Level = "LOW" | "MEDIUM" | "HIGH";

export interface ClientProfile {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  allowedModules: string[];
  hiddenModules: string[];
  defaultHome: string;
  uiDensity: UIDensity;
  safetyLevel: Level;
  onboardingNeed: Level;
  feedbackNeed: Level;
  recommendedNavigation: string;
  primaryCTA: string;
  blockedFeatures: string[];
}

// 模块 id（与路由对齐，仅做语义引用）
export const MODULES = {
  HOME: "/",
  SUBJECT: "/subject",
  REAL_SUBJECT: "/real-subject",
  CALENDAR: "/calendar",
  TIMELINE: "/timeline",
  ADVANCED_CORE: "/advanced-core",
  SIGNAL: "/signal",
  RESONANCE: "/resonance",
  BRANCH_COLLAPSE: "/branch-collapse",
  VITALITY: "/vitality",
  GEO: "/geo",
  PROMPT_FORGE: "/prompt-forge",
  CONSTANTS: "/constants",
  FEEDBACK: "/feedback",
  FEEDBACK_WEIGHTS: "/feedback-weights",
  ACCURACY: "/accuracy",
  RECALCULATION: "/recalculation",
  CONSTITUTION: "/constitution",
  DOCS: "/docs",
  USAGE_SAFETY: "/usage-safety",
  REGIONAL_UX: "/regional-ux",
  BETA_LAUNCH: "/beta-launch",
  VERSION_ITERATION: "/version-iteration",
  SOFTWARE_QA: "/software-qa",
  UI_FIT: "/ui-fit",
} as const;

export const CLIENT_PROFILES: ClientProfile[] = [
  {
    id: "demo_visitor",
    name: "Demo 访客",
    nameEn: "Demo Visitor",
    description: "首次进入，只看模拟主体，不暴露真实主体功能。",
    allowedModules: [MODULES.HOME, MODULES.CALENDAR, MODULES.DOCS, MODULES.USAGE_SAFETY],
    hiddenModules: [MODULES.REAL_SUBJECT, MODULES.ADVANCED_CORE, MODULES.FEEDBACK_WEIGHTS, MODULES.SOFTWARE_QA, MODULES.RECALCULATION, MODULES.VERSION_ITERATION],
    defaultHome: MODULES.HOME,
    uiDensity: "LOW",
    safetyLevel: "HIGH",
    onboardingNeed: "HIGH",
    feedbackNeed: "MEDIUM",
    recommendedNavigation: "顶部 3 项：今日 · 触发日历 · 使用与安全",
    primaryCTA: "开始 Demo 体验",
    blockedFeatures: ["Full 60 编辑", "高级内核", "QA 矩阵"],
  },
  {
    id: "light_user",
    name: "轻量用户",
    nameEn: "Light User",
    description: "使用 Light 20、触发日历、基础回验。",
    allowedModules: [MODULES.HOME, MODULES.SUBJECT, MODULES.CALENDAR, MODULES.TIMELINE, MODULES.FEEDBACK, MODULES.DOCS, MODULES.USAGE_SAFETY, MODULES.ACCURACY],
    hiddenModules: [MODULES.ADVANCED_CORE, MODULES.SOFTWARE_QA, MODULES.RECALCULATION, MODULES.VERSION_ITERATION, MODULES.BETA_LAUNCH],
    defaultHome: MODULES.HOME,
    uiDensity: "MEDIUM",
    safetyLevel: "MEDIUM",
    onboardingNeed: "MEDIUM",
    feedbackNeed: "HIGH",
    recommendedNavigation: "侧栏分两组：今日 / 主体 · 文档",
    primaryCTA: "创建 Light 20 主体",
    blockedFeatures: ["Full 60 默认入口"],
  },
  {
    id: "full_subject_user",
    name: "完整主体用户",
    nameEn: "Full Subject User",
    description: "使用 Full 60，需要隐私保护和高阶解释。",
    allowedModules: [MODULES.HOME, MODULES.SUBJECT, MODULES.REAL_SUBJECT, MODULES.CALENDAR, MODULES.TIMELINE, MODULES.FEEDBACK, MODULES.FEEDBACK_WEIGHTS, MODULES.ACCURACY, MODULES.DOCS, MODULES.USAGE_SAFETY, MODULES.ADVANCED_CORE],
    hiddenModules: [MODULES.SOFTWARE_QA],
    defaultHome: MODULES.REAL_SUBJECT,
    uiDensity: "HIGH",
    safetyLevel: "HIGH",
    onboardingNeed: "HIGH",
    feedbackNeed: "HIGH",
    recommendedNavigation: "进入需隐私确认；侧栏显示真实主体优先",
    primaryCTA: "进入真实主体（私密）",
    blockedFeatures: [],
  },
  {
    id: "creator_user",
    name: "创作者用户",
    nameEn: "Creator User",
    description: "重点使用 Prompt Forge、产品活性、发布窗口。",
    allowedModules: [MODULES.HOME, MODULES.VITALITY, MODULES.PROMPT_FORGE, MODULES.CALENDAR, MODULES.FEEDBACK, MODULES.DOCS, MODULES.REGIONAL_UX],
    hiddenModules: [MODULES.ADVANCED_CORE, MODULES.SOFTWARE_QA, MODULES.RECALCULATION],
    defaultHome: MODULES.VITALITY,
    uiDensity: "HIGH",
    safetyLevel: "MEDIUM",
    onboardingNeed: "MEDIUM",
    feedbackNeed: "HIGH",
    recommendedNavigation: "顶部：活性 · 提示词 · 触发日历 · 回验",
    primaryCTA: "锻造提示词",
    blockedFeatures: ["Full 60 编辑（弱化）"],
  },
  {
    id: "research_user",
    name: "研究用户",
    nameEn: "Research User",
    description: "重点使用白皮书、计算法文档、回验协议、导出。",
    allowedModules: [MODULES.HOME, MODULES.DOCS, MODULES.CONSTANTS, MODULES.CONSTITUTION, MODULES.FEEDBACK, MODULES.ACCURACY, MODULES.RECALCULATION, MODULES.USAGE_SAFETY],
    hiddenModules: [MODULES.PROMPT_FORGE, MODULES.SOFTWARE_QA],
    defaultHome: MODULES.DOCS,
    uiDensity: "HIGH",
    safetyLevel: "MEDIUM",
    onboardingNeed: "LOW",
    feedbackNeed: "MEDIUM",
    recommendedNavigation: "侧栏以文档/计算法/常数为主",
    primaryCTA: "查看计算法文档",
    blockedFeatures: [],
  },
  {
    id: "enterprise_user",
    name: "企业用户",
    nameEn: "Enterprise User",
    description: "只看 Decision OS / Scenario Trigger / Risk Window，不看命运化表达。",
    allowedModules: [MODULES.HOME, MODULES.CALENDAR, MODULES.TIMELINE, MODULES.FEEDBACK, MODULES.ACCURACY, MODULES.DOCS, MODULES.USAGE_SAFETY],
    hiddenModules: [MODULES.REAL_SUBJECT, MODULES.SUBJECT, MODULES.RESONANCE, MODULES.BRANCH_COLLAPSE, MODULES.ADVANCED_CORE, MODULES.PROMPT_FORGE],
    defaultHome: MODULES.HOME,
    uiDensity: "MEDIUM",
    safetyLevel: "HIGH",
    onboardingNeed: "MEDIUM",
    feedbackNeed: "MEDIUM",
    recommendedNavigation: "Decision Overview · Scenario Trigger · Risk Window · Review",
    primaryCTA: "查看 Decision Timing",
    blockedFeatures: ["命运化表达", "主体数列", "Full 60", "风域奇点"],
  },
  {
    id: "beta_tester",
    name: "内测用户",
    nameEn: "Beta Tester",
    description: "需要反馈入口、问题报告、版本状态、使用指引。",
    allowedModules: [MODULES.HOME, MODULES.CALENDAR, MODULES.FEEDBACK, MODULES.BETA_LAUNCH, MODULES.VERSION_ITERATION, MODULES.USAGE_SAFETY, MODULES.DOCS, MODULES.ACCURACY],
    hiddenModules: [MODULES.RECALCULATION],
    defaultHome: MODULES.BETA_LAUNCH,
    uiDensity: "HIGH",
    safetyLevel: "HIGH",
    onboardingNeed: "HIGH",
    feedbackNeed: "HIGH",
    recommendedNavigation: "顶部：内测 · 反馈 · 使用与安全 · 版本",
    primaryCTA: "提交内测反馈",
    blockedFeatures: [],
  },
  {
    id: "admin_founder",
    name: "管理员 / 创始人",
    nameEn: "Admin / Founder",
    description: "可看全部模块、QA、重算、版本迭代、内测发布。",
    allowedModules: Object.values(MODULES),
    hiddenModules: [],
    defaultHome: MODULES.HOME,
    uiDensity: "EXPERT",
    safetyLevel: "MEDIUM",
    onboardingNeed: "LOW",
    feedbackNeed: "MEDIUM",
    recommendedNavigation: "完整侧栏：四组导航全开放",
    primaryCTA: "进入主控台",
    blockedFeatures: [],
  },
  {
    id: "mobile_casual",
    name: "移动端轻用户",
    nameEn: "Mobile Casual User",
    description: "只适合看今日触发、定数、快速回验。",
    allowedModules: [MODULES.HOME, MODULES.CALENDAR, MODULES.FEEDBACK, MODULES.USAGE_SAFETY],
    hiddenModules: [MODULES.REAL_SUBJECT, MODULES.ADVANCED_CORE, MODULES.PROMPT_FORGE, MODULES.SOFTWARE_QA, MODULES.RECALCULATION, MODULES.VERSION_ITERATION, MODULES.FEEDBACK_WEIGHTS],
    defaultHome: MODULES.HOME,
    uiDensity: "LOW",
    safetyLevel: "HIGH",
    onboardingNeed: "MEDIUM",
    feedbackNeed: "HIGH",
    recommendedNavigation: "底部 Tab：今日 / 日历 / 回验 / 我",
    primaryCTA: "查看今日定数",
    blockedFeatures: ["Full 60 编辑", "高级矩阵", "60组表格"],
  },
  {
    id: "power_user",
    name: "高阶用户",
    nameEn: "Power User",
    description: "可使用多计算法内核、Full 60、Prompt Forge、回验权重。",
    allowedModules: Object.values(MODULES).filter(m => m !== MODULES.SOFTWARE_QA),
    hiddenModules: [],
    defaultHome: MODULES.HOME,
    uiDensity: "EXPERT",
    safetyLevel: "MEDIUM",
    onboardingNeed: "LOW",
    feedbackNeed: "HIGH",
    recommendedNavigation: "完整侧栏，可折叠次要分组",
    primaryCTA: "进入高级内核",
    blockedFeatures: [],
  },
];

export type ClientProfileId = typeof CLIENT_PROFILES[number]["id"];

export function getClientProfile(id: string): ClientProfile {
  return CLIENT_PROFILES.find(p => p.id === id) ?? CLIENT_PROFILES[0];
}
