export const TERM_AUDIENCE_MODES = [
  { id: "PUBLIC",   label: "普通用户" },
  { id: "ADVANCED", label: "高阶用户" },
  { id: "FOUNDER",  label: "Founder" },
] as const;
export type TermAudienceMode = (typeof TERM_AUDIENCE_MODES)[number]["id"];
