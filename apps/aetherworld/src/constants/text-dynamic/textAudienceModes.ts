export const TEXT_AUDIENCE_MODES = ["PUBLIC", "ADVANCED", "FOUNDER"] as const;
export type TextAudienceMode = (typeof TEXT_AUDIENCE_MODES)[number];

export const TEXT_AUDIENCE_LABELS: Record<TextAudienceMode, string> = {
  PUBLIC: "普通用户", ADVANCED: "高阶用户", FOUNDER: "创始人",
};
