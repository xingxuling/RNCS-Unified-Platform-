export const CIVILIZATION_SAFETY_RULES = [
  "不把虚拟文明历史当现实历史",
  "不生成现实政治、宗教、群体仇恨宣传",
  "不输出现实暴力指导",
  "不把虚拟经济周期当现实金融",
  "不把文明神话当现实宗教号召",
  "不把虚拟历史人物等同于现实身份",
  "不无限生成历史事件，需受 maxHistoricalEvents 限制",
  "Full60 个人文明历史默认 USER_PRIVATE，仅本地保存",
  "高复杂度历史必须经过压缩输出",
  "导出包必须携带 fiction / privacy metadata",
] as const;

export const CIVILIZATION_SAFETY_NOTE =
  "文明演化与历史模拟用于虚拟世界、创作、游戏与世界观生成。它不代表现实历史，不预测现实政治、战争、宗教、经济或社会变化。Full60 生成的个人文明历史默认仅本地保存，导出前请确认。";

export const CIVILIZATION_HARD_LIMITS = {
  maxHistoricalEvents: 80,
  maxEras: 12,
  maxFigures: 30,
  maxWarRecords: 24,
  maxCatastrophes: 12,
  maxMyths: 12,
  maxReforms: 16,
} as const;
