export interface PersonalitySummary {
  subjectMode: "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";
  styleSummary: string;
  preferences: string[];
  risksToAvoid: string[];
}

export function buildPersonalitySummary(subjectMode: PersonalitySummary["subjectMode"] = "DEMO"): PersonalitySummary {
  return {
    subjectMode,
    styleSummary: subjectMode === "FOUNDER" ? "创始人风格：克制、结构、跨域。" : "通用风格：清晰、产品化、可复用。",
    preferences: ["重视结构清晰", "重视可验证", "重视边界"],
    risksToAvoid: ["不暴露 Full60 原文", "不被当作医学诊断", "不被当作现实身份裁定"],
  };
}
