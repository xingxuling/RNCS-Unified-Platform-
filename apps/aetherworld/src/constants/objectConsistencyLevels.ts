export const OBJECT_CONSISTENCY_LEVELS = [
  { min: 0,  max: 20, level: "LOW",       label: "命名错误或严重失真" },
  { min: 21, max: 40, level: "LOW",       label: "方向模糊" },
  { min: 41, max: 60, level: "MEDIUM",    label: "有雏形但边界不清" },
  { min: 61, max: 80, level: "HIGH",      label: "基本自洽" },
  { min: 81, max: 95, level: "HIGH",      label: "高度自洽" },
  { min: 96, max: 100, level: "EXCELLENT",label: "强本体稳定性" },
] as const;

export function resolveConsistencyLevel(score: number) {
  return OBJECT_CONSISTENCY_LEVELS.find(l => score >= l.min && score <= l.max) ?? OBJECT_CONSISTENCY_LEVELS[0];
}
