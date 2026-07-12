export type FounderRole = "NONE" | "VIEW_ONLY" | "OPERATOR" | "ARCHITECT" | "OWNER";

export interface FounderRoleSpec {
  id: FounderRole;
  title: string;
  en: string;
  description: string;
  level: number;
}

export const FOUNDER_ROLES: Record<FounderRole, FounderRoleSpec> = {
  NONE: {
    id: "NONE",
    title: "无权限",
    en: "Standard User",
    description: "普通用户，无创始人入口。",
    level: 0,
  },
  VIEW_ONLY: {
    id: "VIEW_ONLY",
    title: "只读观察者",
    en: "View Only",
    description: "可以查看部分系统状态，不能修改。",
    level: 1,
  },
  OPERATOR: {
    id: "OPERATOR",
    title: "操作员",
    en: "Operator",
    description: "可执行 QA、重算、导出非敏感报告。",
    level: 2,
  },
  ARCHITECT: {
    id: "ARCHITECT",
    title: "架构师",
    en: "Architect",
    description: "可管理计算法、事件库、Prompt Forge、版本路线。",
    level: 3,
  },
  OWNER: {
    id: "OWNER",
    title: "所有者",
    en: "Founder / Owner",
    description: "可访问全部功能，高风险操作仍需二次确认。",
    level: 4,
  },
};

export function hasAtLeast(role: FounderRole, min: FounderRole): boolean {
  return FOUNDER_ROLES[role].level >= FOUNDER_ROLES[min].level;
}
