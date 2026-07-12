export const ESSENCE_CONFIDENCE_LEVELS = [
  { min: 0,  max: 30, label: "模糊", advice: "信息不足，建议补充关键描述" },
  { min: 31, max: 60, label: "初步", advice: "已有雏形，建议进一步验证" },
  { min: 61, max: 85, label: "清晰", advice: "本质表达成立，可进入下一步推演" },
  { min: 86, max: 100, label: "稳固", advice: "本体高度稳定，可作为标准定义" },
];

export function resolveEssenceLevel(score: number) {
  return ESSENCE_CONFIDENCE_LEVELS.find(l => score >= l.min && score <= l.max) ?? ESSENCE_CONFIDENCE_LEVELS[0];
}
