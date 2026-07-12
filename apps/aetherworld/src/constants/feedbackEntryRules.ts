// 回验入口规范 · 在哪些页面 / 卡片 必须出现回验入口

import type { CurrentPage } from "./manualGuidanceRules";

export interface FeedbackEntrySpec {
  page: CurrentPage;
  positions: string[]; // 描述性的位置
  /** 该入口默认是否使用 compact 卡片 */
  compact?: boolean;
}

export const FEEDBACK_ENTRY_SPECS: FeedbackEntrySpec[] = [
  { page: "Prediction Detail",  positions: ["顶部", "底部"] },
  { page: "Trigger Calendar",   positions: ["日期弹窗"], compact: true },
  { page: "Dashboard",          positions: ["今日定数卡片"], compact: true },
  { page: "Prompt Forge",       positions: ["历史记录"], compact: true },
  { page: "Product Vitality",   positions: ["评估结果"], compact: true },
  { page: "Geo Analysis",       positions: ["结果区"], compact: true },
  { page: "Beta Launch",        positions: ["反馈计划"], compact: true },
  { page: "Version Iteration",  positions: ["Release Gate"], compact: true },
];

/** 快速回验选项 */
export const QUICK_FEEDBACK_OPTIONS = [
  { id: "HIT",            label: "命中",       tone: "emerald" as const },
  { id: "PARTIAL",        label: "部分命中",   tone: "amber"   as const },
  { id: "MISS",           label: "未命中",     tone: "rose"    as const },
  { id: "EARLY",          label: "时间提前",   tone: "cyan"    as const },
  { id: "LATE",           label: "时间延迟",   tone: "cyan"    as const },
  { id: "TYPE_DRIFT",     label: "事件类型漂移", tone: "violet" as const },
  { id: "ACTION_CHANGED", label: "行动改变结果", tone: "violet" as const },
  { id: "NOISE",          label: "信号噪声",   tone: "slate"   as const },
];

export type QuickFeedbackId = (typeof QUICK_FEEDBACK_OPTIONS)[number]["id"];

/** localStorage key — 用于"用户连续查看多次预测但没有回验"的提示 */
export const FEEDBACK_VIEW_COUNTER_KEY = "aether.feedback.viewCounter.v1";
export const FEEDBACK_NUDGE_THRESHOLD = 3;
