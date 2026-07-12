// Tone profiles per audience mode — see spec §7
export type TextToneProfile =
  | "PUBLIC_FRIENDLY"
  | "PUBLIC_GUIDED"
  | "ADVANCED_STRUCTURED"
  | "ADVANCED_TECHNICAL"
  | "FOUNDER_GOVERNANCE"
  | "FOUNDER_TRACE"
  | "SAFETY_NEUTRAL";

export const TEXT_TONE_PROFILES: Record<TextToneProfile, { description: string; allowJargon: boolean; emphasis: string }> = {
  PUBLIC_FRIENDLY:        { description: "少术语、强调下一步", allowJargon: false, emphasis: "怎么用 + 下一步" },
  PUBLIC_GUIDED:          { description: "新手友好引导", allowJargon: false, emphasis: "上手 + 安全边界" },
  ADVANCED_STRUCTURED:    { description: "结构化模块说明", allowJargon: true,  emphasis: "结构 + 导出 + 审计" },
  ADVANCED_TECHNICAL:     { description: "技术细节，简洁", allowJargon: true,  emphasis: "字段 + 公式 + trace" },
  FOUNDER_GOVERNANCE:     { description: "治理、版本、锁定", allowJargon: true,  emphasis: "权限 + 版本 + 锁定" },
  FOUNDER_TRACE:          { description: "可回溯、可审计",   allowJargon: true,  emphasis: "trace + diff" },
  SAFETY_NEUTRAL:         { description: "中性、不承诺、不夸大", allowJargon: false, emphasis: "边界 + 风险" },
};
