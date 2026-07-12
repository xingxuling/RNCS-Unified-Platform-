export const NOISE_SOURCES = [
  "情绪噪声",
  "时间提前",
  "时间延迟",
  "人物变量未到",
  "场域不承载",
  "主线判断偏差",
  "行动改变结果",
  "外界突发变量",
  "预测过强",
  "预测过弱",
] as const;

export type NoiseSource = (typeof NOISE_SOURCES)[number];
