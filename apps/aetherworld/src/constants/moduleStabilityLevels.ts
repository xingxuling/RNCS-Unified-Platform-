// Module Stability Levels — defines the maturity of each module for v1.0 readiness.

export type ModuleStabilityLevel =
  | "STABLE"
  | "BETA"
  | "EXPERIMENTAL"
  | "PLACEHOLDER"
  | "LOCKED";

export interface ModuleStabilityMeta {
  level: ModuleStabilityLevel;
  cn: string;
  en: string;
  desc: string;
  badgeClass: string; // tailwind class hint
}

export const MODULE_STABILITY_META: Record<ModuleStabilityLevel, ModuleStabilityMeta> = {
  STABLE: {
    level: "STABLE",
    cn: "稳定",
    en: "Stable",
    desc: "可进入 v1.0 内测的稳定模块。",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  BETA: {
    level: "BETA",
    cn: "内测可用",
    en: "Beta",
    desc: "功能可用，但需要回验或真实用户反馈。",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  EXPERIMENTAL: {
    level: "EXPERIMENTAL",
    cn: "实验态",
    en: "Experimental",
    desc: "仅对可信用户或研究模式开放。",
    badgeClass: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  },
  PLACEHOLDER: {
    level: "PLACEHOLDER",
    cn: "占位",
    en: "Placeholder",
    desc: "结构已预留，不应作为实际判断依据。",
    badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  },
  LOCKED: {
    level: "LOCKED",
    cn: "锁定",
    en: "Locked",
    desc: "因安全、隐私或误用风险暂不开放。",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
};

export interface ModuleStabilityEntry {
  id: string;
  cn: string;
  en: string;
  level: ModuleStabilityLevel;
  category: "OS" | "CORE" | "META" | "DOCS";
  route?: string;
}

export const MODULE_STABILITY_REGISTRY: ModuleStabilityEntry[] = [
  // ───── STABLE
  { id: "demo-persona", cn: "Demo 主体", en: "Demo Persona", level: "STABLE", category: "OS", route: "/subject" },
  { id: "subject-mode", cn: "主体模式选择器", en: "Subject Mode Selector", level: "STABLE", category: "OS" },
  { id: "trigger-calendar", cn: "触发日历", en: "Trigger Calendar", level: "STABLE", category: "OS", route: "/calendar" },
  { id: "determination-card", cn: "定数判断卡", en: "Determination Card", level: "STABLE", category: "CORE" },
  { id: "constants-library", cn: "常数库", en: "Constants Library", level: "STABLE", category: "META", route: "/constants" },
  { id: "product-docs", cn: "产品文档", en: "Product Docs", level: "STABLE", category: "DOCS", route: "/docs" },
  { id: "user-manual", cn: "使用手册", en: "User Manual", level: "STABLE", category: "DOCS", route: "/docs" },
  { id: "safety-boundary", cn: "安全边界", en: "Safety Boundary", level: "STABLE", category: "DOCS", route: "/docs" },

  // ───── BETA
  { id: "light20-subject", cn: "Light 20 主体", en: "Light 20 Subject", level: "BETA", category: "OS", route: "/real-subject" },
  { id: "feedback-center", cn: "回验中心", en: "Feedback Center", level: "BETA", category: "META", route: "/feedback" },
  { id: "regional-ux", cn: "地区用户体验", en: "Regional UX", level: "BETA", category: "DOCS", route: "/regional-ux" },
  { id: "prompt-forge", cn: "提示词锻造", en: "Prompt Forge", level: "BETA", category: "CORE", route: "/prompt-forge" },
  { id: "beta-launch", cn: "内测发布", en: "Beta Launch", level: "BETA", category: "DOCS", route: "/beta-launch" },
  { id: "product-vitality", cn: "产品活性", en: "Product Vitality", level: "BETA", category: "CORE", route: "/vitality" },
  { id: "geo-analysis", cn: "地理因素", en: "Geo Analysis", level: "BETA", category: "CORE", route: "/geo" },

  // ───── EXPERIMENTAL
  { id: "full60-subject", cn: "Full 60 真实主体", en: "Full 60 Subject", level: "EXPERIMENTAL", category: "OS", route: "/real-subject" },
  { id: "feedback-weights", cn: "回验权重学习", en: "Feedback Weight Learning", level: "EXPERIMENTAL", category: "META", route: "/feedback-weights" },
  { id: "advanced-core", cn: "高级内核", en: "Advanced Core", level: "EXPERIMENTAL", category: "CORE", route: "/advanced-core" },
  { id: "branch-collapse", cn: "分支塌缩", en: "Branch Collapse", level: "EXPERIMENTAL", category: "CORE", route: "/branch-collapse" },
  { id: "resonance-lock", cn: "共振锁定", en: "Resonance Lock", level: "EXPERIMENTAL", category: "CORE", route: "/resonance" },
  { id: "real-subject-deep", cn: "真实主体深度分析", en: "Real Subject Deep Analysis", level: "EXPERIMENTAL", category: "OS", route: "/real-subject" },

  // ───── PLACEHOLDER
  { id: "phase-b", cn: "Phase B｜河图/干支/十神/九宫", en: "Phase B｜Classical Numerics", level: "PLACEHOLDER", category: "META" },
  { id: "phase-c", cn: "Phase C｜天文/月相/物理现实", en: "Phase C｜Astro & Physical", level: "PLACEHOLDER", category: "META" },

  // ───── LOCKED
  { id: "lock-public-subject", cn: "公开分享真实主体数列", en: "Public Real Subject Sharing", level: "LOCKED", category: "OS" },
  { id: "lock-absolute", cn: "绝对断言式预测", en: "Absolute Assertions", level: "LOCKED", category: "CORE" },
  { id: "lock-medical", cn: "医疗 / 法律 / 金融具体建议", en: "Medical / Legal / Financial Advice", level: "LOCKED", category: "DOCS" },
  { id: "lock-mass-signup", cn: "大规模公开注册", en: "Mass Public Signup", level: "LOCKED", category: "DOCS" },
];
