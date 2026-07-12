// 角色权限 UI 规则
import { MODULES } from "./clientProfiles";

export interface RoleUIRule {
  clientId: string;
  show: string[];
  hide: string[];
  emphasize: string[];   // 强调的元素（文案 / Badge）
  enterpriseSafeMode?: boolean;
}

export const ROLE_UI_RULES: RoleUIRule[] = [
  {
    clientId: "demo_visitor",
    show: [MODULES.HOME, MODULES.CALENDAR, MODULES.DOCS, MODULES.USAGE_SAFETY],
    hide: [MODULES.REAL_SUBJECT, MODULES.ADVANCED_CORE, MODULES.FEEDBACK_WEIGHTS, MODULES.SOFTWARE_QA, MODULES.RECALCULATION, MODULES.VERSION_ITERATION, MODULES.BETA_LAUNCH],
    emphasize: ["这是模拟主体", "Demo Persona Badge", "使用与安全入口"],
  },
  {
    clientId: "light_user",
    show: [MODULES.HOME, MODULES.SUBJECT, MODULES.CALENDAR, MODULES.TIMELINE, MODULES.FEEDBACK, MODULES.DOCS, MODULES.USAGE_SAFETY, MODULES.ACCURACY],
    hide: [MODULES.REAL_SUBJECT, MODULES.ADVANCED_CORE, MODULES.SOFTWARE_QA, MODULES.RECALCULATION],
    emphasize: ["Light 20 Badge", "升级到 Full 60 的提示（弱）"],
  },
  {
    clientId: "full_subject_user",
    show: [MODULES.REAL_SUBJECT, MODULES.SUBJECT, MODULES.HOME, MODULES.CALENDAR, MODULES.TIMELINE, MODULES.FEEDBACK, MODULES.FEEDBACK_WEIGHTS, MODULES.ACCURACY, MODULES.DOCS, MODULES.USAGE_SAFETY, MODULES.ADVANCED_CORE],
    hide: [MODULES.SOFTWARE_QA],
    emphasize: ["隐私状态徽章", "Full 60 安全说明", "本地隔离声明"],
  },
  {
    clientId: "creator_user",
    show: [MODULES.VITALITY, MODULES.PROMPT_FORGE, MODULES.CALENDAR, MODULES.FEEDBACK, MODULES.HOME, MODULES.DOCS, MODULES.REGIONAL_UX],
    hide: [MODULES.ADVANCED_CORE, MODULES.SOFTWARE_QA, MODULES.RECALCULATION],
    emphasize: ["发布窗口", "复制提示词", "回验入口"],
  },
  {
    clientId: "research_user",
    show: [MODULES.DOCS, MODULES.CONSTANTS, MODULES.CONSTITUTION, MODULES.FEEDBACK, MODULES.ACCURACY, MODULES.RECALCULATION, MODULES.HOME, MODULES.USAGE_SAFETY],
    hide: [MODULES.PROMPT_FORGE, MODULES.SOFTWARE_QA],
    emphasize: ["Research Mode Badge", "导出按钮", "计算法目录"],
  },
  {
    clientId: "enterprise_user",
    show: [MODULES.HOME, MODULES.CALENDAR, MODULES.TIMELINE, MODULES.FEEDBACK, MODULES.ACCURACY, MODULES.DOCS, MODULES.USAGE_SAFETY],
    hide: [MODULES.REAL_SUBJECT, MODULES.SUBJECT, MODULES.RESONANCE, MODULES.BRANCH_COLLAPSE, MODULES.ADVANCED_CORE, MODULES.PROMPT_FORGE, MODULES.GEO, MODULES.SIGNAL],
    emphasize: ["Enterprise Safe Mode", "Decision Timing", "Scenario Trigger", "Risk Window", "Review Node"],
    enterpriseSafeMode: true,
  },
  {
    clientId: "beta_tester",
    show: [MODULES.BETA_LAUNCH, MODULES.FEEDBACK, MODULES.VERSION_ITERATION, MODULES.USAGE_SAFETY, MODULES.HOME, MODULES.CALENDAR, MODULES.DOCS, MODULES.ACCURACY],
    hide: [MODULES.RECALCULATION],
    emphasize: ["内测状态", "提交问题", "使用指引"],
  },
  {
    clientId: "admin_founder",
    show: Object.values(MODULES),
    hide: [],
    emphasize: ["QA 入口", "重算中心", "版本迭代", "内测发布"],
  },
  {
    clientId: "mobile_casual",
    show: [MODULES.HOME, MODULES.CALENDAR, MODULES.FEEDBACK, MODULES.USAGE_SAFETY],
    hide: [MODULES.REAL_SUBJECT, MODULES.ADVANCED_CORE, MODULES.PROMPT_FORGE, MODULES.SOFTWARE_QA, MODULES.RECALCULATION, MODULES.VERSION_ITERATION, MODULES.FEEDBACK_WEIGHTS, MODULES.SUBJECT],
    emphasize: ["今日定数", "今日行动许可", "快速回验"],
  },
  {
    clientId: "power_user",
    show: Object.values(MODULES).filter(m => m !== MODULES.SOFTWARE_QA),
    hide: [],
    emphasize: ["高级内核", "Full 60", "回验权重"],
  },
];

export function getRoleRule(clientId: string): RoleUIRule {
  return ROLE_UI_RULES.find(r => r.clientId === clientId) ?? ROLE_UI_RULES[0];
}
