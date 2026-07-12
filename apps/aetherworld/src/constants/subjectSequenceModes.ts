// 主体数列模式
export type SubjectSequenceMode = "DEMO" | "LIGHT_20" | "FULL_60" | "IMPORTED";

export interface SequenceModeMeta {
  key: SubjectSequenceMode;
  cn: string;
  en: string;
  rows: number;       // 数列组数（IMPORTED 为 0 表示动态）
  desc: string;
  isRealSubject: boolean;
}

export const SEQUENCE_MODES: Record<SubjectSequenceMode, SequenceModeMeta> = {
  DEMO: {
    key: "DEMO",
    cn: "模拟主体",
    en: "Demo Persona",
    rows: 20,
    desc: "系统预置 Demo Persona，仅用于演示，不代表真实命运。",
    isRealSubject: false,
  },
  LIGHT_20: {
    key: "LIGHT_20",
    cn: "轻量主体",
    en: "Light Subject (20)",
    rows: 20,
    desc: "20 组五位数主体数列，适合快速体验与单循环分析。",
    isRealSubject: true,
  },
  FULL_60: {
    key: "FULL_60",
    cn: "完整主体",
    en: "Full Subject (60)",
    rows: 60,
    desc: "60 组五位数完整命运序列（20 × 3 三循环），用于真实用户深度建模。",
    isRealSubject: true,
  },
  IMPORTED: {
    key: "IMPORTED",
    cn: "导入主体",
    en: "Imported Subject",
    rows: 0,
    desc: "从外部 JSON / CSV 文件导入的主体数列（预留）。",
    isRealSubject: true,
  },
};

export const CYCLE_META = [
  {
    key: "C1" as const,
    cn: "第一循环",
    en: "Cycle 1",
    range: [1, 20] as [number, number],
    interpretation: "原始底盘 / 第一层显化 / 初始命题",
  },
  {
    key: "C2" as const,
    cn: "第二循环",
    en: "Cycle 2",
    range: [21, 40] as [number, number],
    interpretation: "中段修正 / 外界变量介入 / 现实压力层",
  },
  {
    key: "C3" as const,
    cn: "第三循环",
    en: "Cycle 3",
    range: [41, 60] as [number, number],
    interpretation: "终局收束 / 主线显化 / 高阶输出层",
  },
];

export type CycleKey = "C1" | "C2" | "C3";

export const FIVE_DOMAIN_KEYS = ["heaven", "earth", "human", "spirit", "wind"] as const;
export type FiveDomainKey = typeof FIVE_DOMAIN_KEYS[number];

export const FIVE_DOMAIN_META: Record<FiveDomainKey, { cn: string; short: string; desc: string; colorVar: string }> = {
  heaven: { cn: "天", short: "天域", desc: "时间 · 周期 · 窗口 · 趋势",          colorVar: "var(--tian)" },
  earth:  { cn: "地", short: "地域", desc: "空间 · 资源 · 场域 · 制度 · 承载",   colorVar: "var(--di)" },
  human:  { cn: "人", short: "人域", desc: "人物 · 关系 · 合作 · 组织 · 动机",   colorVar: "var(--ren)" },
  spirit: { cn: "神", short: "神域", desc: "主轴 · 意义 · 使命 · 叙事合法性",     colorVar: "var(--shen)" },
  wind:   { cn: "风", short: "风域", desc: "变局 · 流动 · 传播 · 突发 · 转向",   colorVar: "var(--feng)" },
};
