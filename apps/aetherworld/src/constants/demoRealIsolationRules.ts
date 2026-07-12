// Demo / Real 隔离规范

import type { SubjectSequenceMode } from "./subjectSequenceModes";

export interface IsolationModeMeta {
  key: SubjectSequenceMode;
  label: string;        // 短标签
  fullLabel: string;    // 完整标签
  description: string;
  tone: "cyan" | "violet" | "amber" | "slate";
  badgeClass: string;
  isRealSubject: boolean;
}

export const ISOLATION_MODE_META: Record<SubjectSequenceMode, IsolationModeMeta> = {
  DEMO: {
    key: "DEMO",
    label: "Demo Persona",
    fullLabel: "Demo Persona · 模拟主体",
    description: "演示数据，不代表真实用户命运。",
    tone: "cyan",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    isRealSubject: false,
  },
  LIGHT_20: {
    key: "LIGHT_20",
    label: "Light 20",
    fullLabel: "Light 20 · 轻量真实主体",
    description: "轻量主体，仅用于初步体验。",
    tone: "violet",
    badgeClass: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    isRealSubject: true,
  },
  FULL_60: {
    key: "FULL_60",
    label: "Full 60 Private",
    fullLabel: "Full 60 · 完整真实主体（高敏感）",
    description: "完整主体，高敏感数据，仅本地保存。",
    tone: "amber",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    isRealSubject: true,
  },
  IMPORTED: {
    key: "IMPORTED",
    label: "Imported",
    fullLabel: "Imported · 导入主体",
    description: "导入主体，请确认来源与隐私。",
    tone: "slate",
    badgeClass: "bg-slate-400/15 text-slate-200 border-slate-400/30",
    isRealSubject: true,
  },
};

/** 隔离原则（用于文档与运行时校验） */
export const ISOLATION_RULES = [
  "Demo 数据不进入真实主体回验权重",
  "真实主体数据不会覆盖 Demo Persona",
  "Demo 页面不显示「你的命运」之类断言文案，仅显示「模拟主体」",
  "Full 60 页面必须显示隐私状态",
  "Demo → Real 切换必须显示提示，数据独立保存不混合",
];

/** Demo / Real 切换提示文案 */
export const DEMO_TO_REAL_NOTICE =
  "你正在从模拟主体切换到真实主体。真实主体数据将独立保存，不会与 Demo 混合。";
