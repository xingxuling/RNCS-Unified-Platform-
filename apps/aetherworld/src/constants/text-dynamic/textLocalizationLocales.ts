export const TEXT_LOCALES = ["zh-CN", "zh-HK", "zh-TW", "en", "ja", "ko", "fr"] as const;
export type TextLocale = (typeof TEXT_LOCALES)[number];

export const TEXT_PRIMARY_LOCALE: TextLocale = "zh-CN";

export const TEXT_LOCALE_LABELS: Record<TextLocale, string> = {
  "zh-CN": "简体中文", "zh-HK": "繁體中文（港）", "zh-TW": "繁體中文（台）",
  en: "English", ja: "日本語", ko: "한국어", fr: "Français",
};
