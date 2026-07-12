export const BREAKTHROUGH_VALIDATION_TYPES = [
  { id: "BEHAVIORAL", name: "行为信号", description: "可观察的真实行为变化。" },
  { id: "QUANTITATIVE", name: "数值信号", description: "可计数的指标变化。" },
  { id: "FEEDBACK", name: "反馈信号", description: "来自他人/用户的真实反馈。" },
  { id: "TIME_WINDOW", name: "时间窗口", description: "在某时点检视结果。" },
  { id: "ABSENCE", name: "缺席信号", description: "原本会出现的问题是否消失。" },
] as const;
