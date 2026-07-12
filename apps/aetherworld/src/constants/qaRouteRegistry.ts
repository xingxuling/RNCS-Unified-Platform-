// QA Route Registry · 已知路由清单（与侧边栏 / routeTree 对齐）

export interface QARouteEntry {
  path: string;
  title: string;
  en: string;
  sidebar: boolean;       // 是否出现在侧边栏
  group: string;          // 所属分组
  risk: "LOW" | "MEDIUM" | "HIGH";
  requiresFeedbackEntry: boolean;
  requiresSafetyBoundary: boolean;
  requiresPrivacyWarning: boolean;
}

export const QA_ROUTE_REGISTRY: QARouteEntry[] = [
  { path: "/",                   title: "主控台",     en: "Dashboard",          sidebar: true,  group: "预测系统",     risk: "LOW",    requiresFeedbackEntry: true,  requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/subject",            title: "主体模型",   en: "Subject Seed",       sidebar: true,  group: "预测系统",     risk: "MEDIUM", requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/real-subject",       title: "真实主体",   en: "Real Subject (60)",  sidebar: true,  group: "预测系统",     risk: "HIGH",   requiresFeedbackEntry: false, requiresSafetyBoundary: true,  requiresPrivacyWarning: true  },
  { path: "/calendar",           title: "触发日历",   en: "Trigger Calendar",   sidebar: true,  group: "预测系统",     risk: "LOW",    requiresFeedbackEntry: true,  requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/timeline",           title: "未来时间线", en: "Time-Field Engine",  sidebar: true,  group: "预测系统",     risk: "MEDIUM", requiresFeedbackEntry: true,  requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/advanced-core",      title: "高级内核",   en: "Advanced Core",      sidebar: true,  group: "多计算法内核", risk: "MEDIUM", requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/signal",             title: "信号净化",   en: "Signal Purification",sidebar: true,  group: "多计算法内核", risk: "LOW",    requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/resonance",          title: "共振锁定",   en: "Resonance Lock",     sidebar: true,  group: "多计算法内核", risk: "LOW",    requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/branch-collapse",    title: "分支塌缩",   en: "Branch Collapse",    sidebar: true,  group: "多计算法内核", risk: "LOW",    requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/vitality",           title: "产品活性",   en: "Product Vitality",   sidebar: true,  group: "多计算法内核", risk: "MEDIUM", requiresFeedbackEntry: true,  requiresSafetyBoundary: true,  requiresPrivacyWarning: false },
  { path: "/geo",                title: "地理因素",   en: "Geo-Factor",         sidebar: true,  group: "多计算法内核", risk: "MEDIUM", requiresFeedbackEntry: true,  requiresSafetyBoundary: true,  requiresPrivacyWarning: false },
  { path: "/prompt-forge",       title: "提示词锻造", en: "Prompt Forge",       sidebar: true,  group: "多计算法内核", risk: "MEDIUM", requiresFeedbackEntry: true,  requiresSafetyBoundary: true,  requiresPrivacyWarning: false },
  { path: "/constants",          title: "常数库",     en: "Constant Universe",  sidebar: true,  group: "常数 · 回验",  risk: "LOW",    requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/feedback",           title: "回验中心",   en: "Feedback Loop",      sidebar: true,  group: "常数 · 回验",  risk: "LOW",    requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/feedback-weights",   title: "回验权重",   en: "Weight Engine",      sidebar: true,  group: "常数 · 回验",  risk: "MEDIUM", requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/constitution",       title: "系统宪法",   en: "Constitution",       sidebar: true,  group: "常数 · 回验",  risk: "LOW",    requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/docs",               title: "产品文档",   en: "Documentation",      sidebar: true,  group: "产品文档",     risk: "LOW",    requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/usage-safety",       title: "使用与安全", en: "Usage & Safety",     sidebar: true,  group: "产品文档",     risk: "LOW",    requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/regional-ux",        title: "地区体验",   en: "Regional UX",        sidebar: true,  group: "产品文档",     risk: "LOW",    requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/beta-launch",        title: "内测发布",   en: "Beta Launch",        sidebar: true,  group: "产品文档",     risk: "HIGH",   requiresFeedbackEntry: true,  requiresSafetyBoundary: true,  requiresPrivacyWarning: false },
  { path: "/version-iteration",  title: "版本迭代",   en: "Version Iteration",  sidebar: true,  group: "产品文档",     risk: "HIGH",   requiresFeedbackEntry: true,  requiresSafetyBoundary: true,  requiresPrivacyWarning: false },
  { path: "/software-qa",        title: "软件测试",   en: "Software QA",        sidebar: true,  group: "产品文档",     risk: "MEDIUM", requiresFeedbackEntry: false, requiresSafetyBoundary: true,  requiresPrivacyWarning: false },
  { path: "/prediction/$date",   title: "预测详情",   en: "Prediction Detail",  sidebar: false, group: "预测系统",     risk: "HIGH",   requiresFeedbackEntry: true,  requiresSafetyBoundary: true,  requiresPrivacyWarning: false },

  // Text Dynamic Update Engine 路由
  { path: "/text-dynamic-update", title: "文本动态更新", en: "Text Dynamic Update", sidebar: true, group: "UI 界面更新", risk: "MEDIUM", requiresFeedbackEntry: false, requiresSafetyBoundary: true,  requiresPrivacyWarning: false },
  { path: "/text-registry",       title: "文本注册表",   en: "Text Registry",       sidebar: true, group: "UI 界面更新", risk: "LOW",    requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/text-audit",          title: "文本审计",     en: "Text Audit",          sidebar: true, group: "UI 界面更新", risk: "MEDIUM", requiresFeedbackEntry: false, requiresSafetyBoundary: true,  requiresPrivacyWarning: false },
  { path: "/text-versions",       title: "文本版本",     en: "Text Versions",       sidebar: true, group: "UI 界面更新", risk: "LOW",    requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
  { path: "/text-localization",   title: "文本本地化",   en: "Text Localization",   sidebar: true, group: "UI 界面更新", risk: "LOW",    requiresFeedbackEntry: false, requiresSafetyBoundary: false, requiresPrivacyWarning: false },
];
