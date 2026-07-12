// QA Severity Levels · 软件测试反馈严重等级

export type QASeverity =
  | "BLOCKER"
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INFO";

export interface QASeverityMeta {
  key: QASeverity;
  cn: string;
  en: string;
  weight: number; // 用于 health score 惩罚
  tone: string;   // tailwind 文本/边框 tone
  badgeClass: string;
  description: string;
}

export const QA_SEVERITY_META: Record<QASeverity, QASeverityMeta> = {
  BLOCKER: {
    key: "BLOCKER",
    cn: "阻断",
    en: "Blocker",
    weight: 40,
    tone: "rose",
    badgeClass: "bg-rose-500/20 text-rose-200 border-rose-500/40",
    description: "导致核心流程不可用，必须立刻修复。",
  },
  CRITICAL: {
    key: "CRITICAL",
    cn: "严重",
    en: "Critical",
    weight: 20,
    tone: "orange",
    badgeClass: "bg-orange-500/15 text-orange-200 border-orange-500/40",
    description: "影响真实主体 / 安全边界 / 数据隔离 / 回验学习 / 内测发布。",
  },
  HIGH: {
    key: "HIGH",
    cn: "高",
    en: "High",
    weight: 8,
    tone: "amber",
    badgeClass: "bg-amber-500/15 text-amber-200 border-amber-500/40",
    description: "影响重要模块使用，但有替代路径。",
  },
  MEDIUM: {
    key: "MEDIUM",
    cn: "中",
    en: "Medium",
    weight: 3,
    tone: "yellow",
    badgeClass: "bg-yellow-500/15 text-yellow-200 border-yellow-500/30",
    description: "影响体验、文案、空状态、引导。",
  },
  LOW: {
    key: "LOW",
    cn: "低",
    en: "Low",
    weight: 1,
    tone: "slate",
    badgeClass: "bg-slate-400/15 text-slate-200 border-slate-400/30",
    description: "轻微 UI、文案、布局问题。",
  },
  INFO: {
    key: "INFO",
    cn: "信息",
    en: "Info",
    weight: 0,
    tone: "cyan",
    badgeClass: "bg-cyan-500/10 text-cyan-200 border-cyan-500/30",
    description: "建议优化，不影响当前内测。",
  },
};

export const QA_SEVERITY_ORDER: QASeverity[] = [
  "BLOCKER",
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "INFO",
];
