// Constant Universe v0.2 — Compression Constants
export const COMPRESSION_CONSTANTS = {
  ULTRA_SHORT_MAX_CHARS: 160,
  NORMAL_USER_MAX_SECTIONS: 5,
  STRUCTURED_MAX_SECTIONS: 9,
  FOUNDER_TRACE_MAX_SECTIONS: 30,
  BLACKBOX_SIGNAL_MUST_BE_MARKED: true,
  SAFETY_NOTES_REQUIRED_FOR_HIGH_RISK: true,
  VALIDATION_POINTS_REQUIRED: true,
  NEXT_ACTIONS_REQUIRED: true,
} as const;

export const NORMAL_USER_DEFAULT_SECTIONS = [
  "结论",
  "原因",
  "下一步",
  "验证点",
  "风险",
] as const;

export const FOUNDER_EXPANDABLE_SECTIONS = [
  "黑箱信号",
  "白箱结构",
  "引擎 trace",
  "常数引用",
  "风险判断",
  "重算依据",
] as const;
