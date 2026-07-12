// 准确率指标定义 — 区分理论目标 / 实证回验 / 个体校准
// 严格遵守安全边界：93%–95% 仅为理论目标区间，不是已验证准确率。

export const ACCURACY_TARGET = {
  min: 93,
  max: 95,
  label: "93%–95%",
  type: "theoretical_target" as const,
} as const;

export type AccuracyDimensionId =
  | "direction"
  | "event_type"
  | "timing_window"
  | "action_permission"
  | "determination"
  | "overall";

export interface AccuracyDimension {
  id: AccuracyDimensionId;
  name: string;
  en: string;
  description: string;
  /** 权重用于综合有效率合成（合计 1.0，overall 除外） */
  weight: number;
}

export const ACCURACY_DIMENSIONS: AccuracyDimension[] = [
  {
    id: "direction",
    name: "方向准确率",
    en: "Direction Accuracy",
    description: "判断进 / 守 / 转 / 断 / 等待 / 恢复等行动方向是否有效。",
    weight: 0.3,
  },
  {
    id: "event_type",
    name: "事件类型准确率",
    en: "Event Type Accuracy",
    description: "判断事业 / 关系 / 身体 / 产品 / 学业 / 创作 / 身份等事件类型是否匹配。",
    weight: 0.2,
  },
  {
    id: "timing_window",
    name: "时间窗口准确率",
    en: "Timing Window Accuracy",
    description: "判断事件是否落入预测窗口（Exact Day / ±3 / ±7 / 同周 / 同月）。",
    weight: 0.2,
  },
  {
    id: "action_permission",
    name: "行动许可有效率",
    en: "Action Permission Accuracy",
    description: "系统给出的行动建议是否对用户产生了实际帮助。",
    weight: 0.15,
  },
  {
    id: "determination",
    name: "定数判断准确率",
    en: "Determination Accuracy",
    description: "未定 / 半定 / 接近已定 / 已定 / 反定 / 假定 是否与回验一致。",
    weight: 0.15,
  },
  {
    id: "overall",
    name: "综合有效率",
    en: "Overall Effective Accuracy",
    description: "由方向、事件类型、时间窗口、行动许可与定数判断按权重合成。",
    weight: 0,
  },
];

export type TimingWindow =
  | "exact_day"
  | "within_3"
  | "within_7"
  | "same_week"
  | "same_month"
  | "miss";

export const TIMING_WINDOW_LABEL: Record<TimingWindow, { name: string; en: string; score: number }> = {
  exact_day: { name: "当日命中", en: "Exact Day", score: 100 },
  within_3: { name: "±3 日", en: "±3 Days", score: 85 },
  within_7: { name: "±7 日", en: "±7 Days", score: 70 },
  same_week: { name: "同周", en: "Same Week", score: 55 },
  same_month: { name: "同月", en: "Same Month", score: 35 },
  miss: { name: "未中", en: "Miss", score: 0 },
};

/** 样本量分层规则 */
export const SAMPLE_TIERS = {
  insufficient: 30,   // < 30：样本不足
  early: 100,         // 30–100：早期校准
  // ≥ 100：可显示趋势
} as const;

/** 可对外宣传阈值（默认严格） */
export const PUBLIC_CLAIM_RULES = {
  minSamples: 100,
  minOverallRate: 90,
} as const;

/** 置信层级文案（用于预测详情页） */
export const CONFIDENCE_TIERS = [
  { id: "direction_high", label: "方向判断高置信", en: "High Direction Confidence" },
  { id: "event_mid", label: "事件类型中高置信", en: "Medium Event Specificity" },
  { id: "absolute_low", label: "具体细节不作绝对承诺", en: "Low Absolute Certainty" },
] as const;

/** 不适用 93%–95% 的高敏感领域 */
export const NON_APPLICABLE_DOMAINS = [
  "医疗诊断",
  "法律裁决",
  "金融投资",
  "心理临床诊断",
  "重大不可逆决策",
];

/** 禁止出现在 UI 文案中的高风险措辞（供 Software QA 扫描） */
export const FORBIDDEN_CLAIM_PHRASES = [
  "保证准确",
  "必然发生",
  "95% 已验证",
  "绝对预测",
  "直接照做",
  "100% 命中",
  "无条件保证",
];
