export type SubjectModeId = "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";

export interface SubjectModeMeta {
  id: SubjectModeId;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  requiresRealSubject: boolean;
  sequenceCount: number;
  depth: "demo_only" | "light_personalized" | "deep_personalized" | "founder_grade";
}

export const SUBJECT_MODES: Record<SubjectModeId, SubjectModeMeta> = {
  DEMO: {
    id: "DEMO",
    label: "Demo 模式",
    shortLabel: "Demo",
    description: "演示模式，使用示例主体数列，不代表真实结果。",
    badgeClass: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30",
    requiresRealSubject: false,
    sequenceCount: 0,
    depth: "demo_only",
  },
  LIGHT_20: {
    id: "LIGHT_20",
    label: "真实主体 · Light20",
    shortLabel: "Light20",
    description: "轻量真实主体模式，使用 20 组主体数列。",
    badgeClass: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
    requiresRealSubject: true,
    sequenceCount: 20,
    depth: "light_personalized",
  },
  FULL_60: {
    id: "FULL_60",
    label: "真实主体 · Full60",
    shortLabel: "Full60",
    description: "完整真实主体模式，使用 60 组主体数列，默认仅本地保存。",
    badgeClass: "bg-purple-500/15 text-purple-200 border border-purple-500/30",
    requiresRealSubject: true,
    sequenceCount: 60,
    depth: "deep_personalized",
  },
  FOUNDER: {
    id: "FOUNDER",
    label: "Founder Subject",
    shortLabel: "Founder",
    description: "创始人主体模式，可使用 Full60 + Founder 权限 + 高阶引擎。",
    badgeClass: "bg-amber-500/20 text-amber-200 border border-amber-500/40",
    requiresRealSubject: true,
    sequenceCount: 60,
    depth: "founder_grade",
  },
};

export const SUBJECT_MODE_LIST: SubjectModeMeta[] = Object.values(SUBJECT_MODES);
