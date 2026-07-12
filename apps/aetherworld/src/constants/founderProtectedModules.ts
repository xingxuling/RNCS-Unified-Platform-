import type { RiskLevel } from "./founderPermissionLevels";
import type { FounderRole } from "./founderRoles";

export interface ProtectedModule {
  id: string;
  title: string;
  en: string;
  route?: string;
  category: "CORE" | "QA" | "RELEASE" | "EVENT" | "PROMPT" | "DOCS" | "FOUNDER";
  minRole: FounderRole;
  riskLevel: RiskLevel;
  description: string;
  hiddenFromNormalUser: boolean;
}

export const FOUNDER_PROTECTED_MODULES: ProtectedModule[] = [
  { id: "advanced-core",          title: "综合判断内核",       en: "Advanced Core",                 route: "/advanced-core",         category: "CORE",    minRole: "VIEW_ONLY", riskLevel: "MEDIUM",   description: "完整 60 维深度判断",                 hiddenFromNormalUser: false },
  { id: "calculus-universe",      title: "计算法宇宙百科",     en: "Calculus Universe Codex",       route: "/constitution",          category: "CORE",    minRole: "ARCHITECT", riskLevel: "MEDIUM",   description: "所有计算法的总目录与逻辑说明",       hiddenFromNormalUser: true  },
  { id: "event-library-audit",    title: "事件库审计",         en: "Event Library Audit",           route: "/event-library-audit",   category: "EVENT",   minRole: "OPERATOR",  riskLevel: "MEDIUM",   description: "事件库健康度、重复簇、字段补齐扫描", hiddenFromNormalUser: true  },
  { id: "event-bulk-completion",  title: "事件库批量施工",     en: "Event Bulk Completion",         route: "/event-library-audit",   category: "EVENT",   minRole: "ARCHITECT", riskLevel: "HIGH",     description: "批量补齐事件字段并合并重复簇",       hiddenFromNormalUser: true  },
  { id: "software-qa",            title: "软件测试",           en: "Software QA",                   route: "/software-qa",           category: "QA",      minRole: "OPERATOR",  riskLevel: "MEDIUM",   description: "全系统 QA 巡检与修复建议",            hiddenFromNormalUser: true  },
  { id: "recalculation",          title: "重算中心",           en: "Recalculation Center",          route: "/recalculation",         category: "QA",      minRole: "OPERATOR",  riskLevel: "HIGH",     description: "全主体 / 全事件 / 全系统重算",        hiddenFromNormalUser: true  },
  { id: "version-iteration",      title: "版本迭代",           en: "Version Iteration",             route: "/version-iteration",     category: "RELEASE", minRole: "ARCHITECT", riskLevel: "HIGH",     description: "版本路线图、Release Blocker 管理",    hiddenFromNormalUser: true  },
  { id: "beta-launch",            title: "内测发布控制",       en: "Beta Launch",                   route: "/beta-launch",           category: "RELEASE", minRole: "OWNER",     riskLevel: "CRITICAL", description: "Alpha / Beta / Waitlist 控制",        hiddenFromNormalUser: true  },
  { id: "abstract-prompt-forge",  title: "抽象提示词工坊",     en: "Abstract Prompt Forge",         route: "/abstract-prompt-forge", category: "PROMPT",  minRole: "ARCHITECT", riskLevel: "MEDIUM",   description: "抽象迁移化提示词模板",                hiddenFromNormalUser: true  },
  { id: "prompt-template-library",title: "提示词模板库",       en: "Prompt Template Library",       route: "/prompt-forge",          category: "PROMPT",  minRole: "OPERATOR",  riskLevel: "LOW",      description: "完整提示词模板（含 Founder 模板）",   hiddenFromNormalUser: false },
  { id: "feedback-weight-matrix", title: "回验权重矩阵",       en: "Feedback Weight Matrix",        route: "/feedback-weights",      category: "QA",      minRole: "ARCHITECT", riskLevel: "MEDIUM",   description: "回验权重与学习速度",                  hiddenFromNormalUser: true  },
  { id: "accuracy-metrics-advanced", title: "高级有效率",      en: "Accuracy Metrics Advanced",     route: "/accuracy",              category: "QA",      minRole: "ARCHITECT", riskLevel: "MEDIUM",   description: "完整准确率与置信度面板",              hiddenFromNormalUser: true  },
  { id: "full60-deep-analysis",   title: "Full 60 深度分析",   en: "Full 60 Deep Analysis",         route: "/real-subject",          category: "CORE",    minRole: "OWNER",     riskLevel: "HIGH",     description: "真实主体 Full 60 维度",               hiddenFromNormalUser: true  },
  { id: "product-docs-editor",    title: "产品文档编辑器",     en: "Product Docs Editor",           route: "/docs",                  category: "DOCS",    minRole: "ARCHITECT", riskLevel: "MEDIUM",   description: "文档结构与回链编辑",                  hiddenFromNormalUser: false },
  { id: "system-constitution",    title: "系统宪法",           en: "System Constitution",           route: "/constitution",          category: "DOCS",    minRole: "ARCHITECT", riskLevel: "MEDIUM",   description: "系统宪法与核心定义",                  hiddenFromNormalUser: false },
  { id: "founder-console",        title: "创始人控制台",       en: "Founder Console",               route: "/founder-console",       category: "FOUNDER", minRole: "OWNER",     riskLevel: "HIGH",     description: "创始人模式主控台",                    hiddenFromNormalUser: true  },
  { id: "founder-permissions",    title: "创始人权限矩阵",     en: "Founder Permissions",           route: "/founder-permissions",   category: "FOUNDER", minRole: "OWNER",     riskLevel: "CRITICAL", description: "权限分配与可见性控制",                hiddenFromNormalUser: true  },
  { id: "founder-audit-log",      title: "创始人操作日志",     en: "Founder Audit Log",             route: "/founder",               category: "FOUNDER", minRole: "OWNER",     riskLevel: "LOW",      description: "创始人操作审计记录",                  hiddenFromNormalUser: true  },
];

export function findProtectedModule(id: string) {
  return FOUNDER_PROTECTED_MODULES.find((m) => m.id === id);
}
