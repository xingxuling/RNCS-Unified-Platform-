// 地区化禁词 / 偏好词
export const FORBIDDEN_TERMS: Record<string, string[]> = {
  enterprise: ["命运", "占卜", "神秘", "玄学", "fortune", "divination", "mystic"],
  cn: ["绝对预言", "必然发生", "命定", "天注定"],
  research: ["命运", "玄学", "宿命", "fortune"],
  us: ["fortune-telling", "divination"],
};

export const PREFERRED_TERMS: Record<string, string[]> = {
  enterprise: ["scenario", "risk window", "action permission", "review node", "decision intelligence"],
  cn: ["趋势", "时间窗口", "行动建议", "复盘", "结构判断"],
  hk: ["structured forecast", "decision OS", "action permission", "结构判断", "行动许可"],
  sg: ["timing window", "private model", "feedback loop", "action permission"],
  tw: ["訊號", "階段", "回驗", "時間窗口", "關係"],
  jp: ["rhythm", "signal", "alignment", "リズム", "兆し"],
  us: ["reflective AI", "decision support", "feedback loop", "pattern tracking"],
  research: ["prototype", "methodology", "feedback protocol", "calibration"],
  creator: ["launch window", "prompt", "product vitality", "next action"],
  global: ["timing", "signal", "action", "feedback"],
};

export const UNIVERSAL_DISCLAIMERS = [
  "Not medical advice.",
  "Not legal advice.",
  "Not financial / investment advice.",
  "Not a deterministic future claim.",
];
