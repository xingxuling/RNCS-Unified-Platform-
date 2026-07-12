export interface VirtualDailyRhythm {
  id: string;
  userFriendlyName: string;
  hourRange: [number, number];
  virtualScene: string;
  realAdvice: string;
  riskWarning: string;
  recommendedQuestTypes: string[];
}

export const VIRTUAL_DAILY_RHYTHMS: VirtualDailyRhythm[] = [
  { id: "MORNING_OPENING",       userFriendlyName: "清晨开启", hourRange: [5, 10],   virtualScene: "光线沿世界边缘缓缓铺开。", realAdvice: "设定今日唯一主任务。",         riskWarning: "避免一早就刷信息。",   recommendedQuestTypes: ["DAILY_ANCHOR", "WORLD_EXPLORATION"] },
  { id: "MIDDAY_ACTION",         userFriendlyName: "午间行动", hourRange: [10, 15],  virtualScene: "广场上各角色各就其位。",   realAdvice: "执行核心现实任务。",           riskWarning: "避免无序切换。",       recommendedQuestTypes: ["PRODUCT_BUILD", "CREATIVE_OUTPUT", "DAILY_ANCHOR"] },
  { id: "AFTERNOON_ADJUSTMENT",  userFriendlyName: "下午调整", hourRange: [15, 18],  virtualScene: "风向开始变化。",            realAdvice: "修正计划，处理阻力。",         riskWarning: "避免硬撑同一方法。",   recommendedQuestTypes: ["RISK_REDUCTION", "FEEDBACK_TASK"] },
  { id: "EVENING_REFLECTION",    userFriendlyName: "夜间反思", hourRange: [18, 22],  virtualScene: "城市点亮，世界变安静。",   realAdvice: "写日记、回验、归档。",         riskWarning: "避免拉新任务进今天。", recommendedQuestTypes: ["FEEDBACK_TASK", "ARCHIVE_TASK", "SOCIAL_SIGNAL"] },
  { id: "NIGHT_CREATION",        userFriendlyName: "深夜创作", hourRange: [22, 29],  virtualScene: "只剩工坊的一盏灯。",       realAdvice: "若必要创作，设定结束时间。",   riskWarning: "避免熬夜，注意睡眠。", recommendedQuestTypes: ["CREATIVE_OUTPUT", "ARCHIVE_TASK", "RECOVERY_TASK"] },
];

export function getRhythmForHour(hour: number): VirtualDailyRhythm {
  const h = hour < 5 ? hour + 24 : hour;
  return VIRTUAL_DAILY_RHYTHMS.find(r => h >= r.hourRange[0] && h < r.hourRange[1]) ?? VIRTUAL_DAILY_RHYTHMS[0];
}
