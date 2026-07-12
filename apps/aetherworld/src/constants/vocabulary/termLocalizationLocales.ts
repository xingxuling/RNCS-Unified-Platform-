export const TERM_LOCALES = [
  { id: "zh-CN", label: "简体中文" },
  { id: "zh-HK", label: "繁體中文（港）" },
  { id: "zh-TW", label: "繁體中文（台）" },
  { id: "en",    label: "English" },
  { id: "ja",    label: "日本語" },
  { id: "ko",    label: "한국어" },
  { id: "fr",    label: "Français" },
] as const;
export type TermLocaleId = (typeof TERM_LOCALES)[number]["id"];
