// 常数宇宙 v1.0 · 回验常数
export interface FeedbackOutcomeWeight {
  id: string;
  name: string;
  userFriendlyName: string;
  delta: number; // 权重修正
}

export const FEEDBACK_OUTCOME_WEIGHTS: FeedbackOutcomeWeight[] = [
  { id: "QUICK_ACCURATE", name: "命中",       userFriendlyName: "说中了",       delta: +1.0  },
  { id: "QUICK_PARTIAL",  name: "部分命中",   userFriendlyName: "对了一半",     delta: +0.45 },
  { id: "QUICK_WRONG",    name: "错误",       userFriendlyName: "完全没中",     delta: -0.65 },
  { id: "NOT_YET",        name: "还没发生",   userFriendlyName: "时间没到",     delta:  0    },
  { id: "UNSURE",         name: "不确定",     userFriendlyName: "说不准",       delta:  0    },
];

export const FEEDBACK_TIMING_WEIGHTS = {
  EXACT_DAY:   +1.0,
  EARLY:       -0.2, // 系统提前
  DELAYED:     -0.15,
  SAME_WEEK:   +0.65,
  SAME_MONTH:  +0.35,
};

export const FEEDBACK_BIAS_FLAGS = {
  ACTION_CHANGED_OUTCOME:    { penalty: 0,    note: "行动改写，不惩罚预测" },
  SIGNAL_NOISE:              { penalty: -0.2, note: "提高信号净化阈值" },
  EVENT_TYPE_DRIFT:          { penalty: -0.25,note: "降低事件解码权重" },
  FIELD_NOT_READY:           { penalty: -0.1, note: "提高场域常数权重" },
  HUMAN_VARIABLE_MISSING:    { penalty: -0.15,note: "提高人域确认权重" },
};

export const FEEDBACK_SAMPLE_DISCOUNT = [
  { range: "<10",     factor: 0.35, label: "强折扣" },
  { range: "10-30",   factor: 0.6,  label: "早期校准" },
  { range: "30-100",  factor: 0.85, label: "初步可信" },
  { range: "100+",    factor: 1.0,  label: "可显示趋势" },
];

export function sampleDiscountFactor(n: number) {
  if (n < 10) return 0.35;
  if (n < 30) return 0.6;
  if (n < 100) return 0.85;
  return 1.0;
}
