import { LanguageCode, SUPPORTED_LANGUAGES, getLanguage } from "@/constants/i18n/supportedLanguages";

const STORAGE_KEY = "aether_language_preference";
const LOCK_KEY = "aether_language_lock";

type Listener = (lang: LanguageCode) => void;
const listeners = new Set<Listener>();

function detectBrowser(): LanguageCode {
  if (typeof navigator === "undefined") return "zh-CN";
  const langs = navigator.languages ?? [navigator.language];
  for (const raw of langs) {
    const l = raw.toLowerCase();
    if (l.startsWith("zh-cn") || l === "zh") return "zh-CN";
    if (l.startsWith("zh-hk")) return "zh-HK";
    if (l.startsWith("zh-tw") || l.startsWith("zh-hant")) return "zh-TW";
    if (l.startsWith("ja")) return "ja";
    if (l.startsWith("ko")) return "ko";
    if (l.startsWith("fr")) return "fr";
    if (l.startsWith("en")) return "en";
  }
  return "zh-CN";
}

export function getCurrentLanguage(): LanguageCode {
  if (typeof localStorage === "undefined") return "zh-CN";
  const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
  if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) return stored;
  return detectBrowser();
}

export function setCurrentLanguage(code: LanguageCode) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, code);
  }
  listeners.forEach(l => l(code));
}

export function getLockedLanguage(): LanguageCode | null {
  if (typeof localStorage === "undefined") return null;
  const v = localStorage.getItem(LOCK_KEY) as LanguageCode | null;
  return v ?? null;
}

export function setLockedLanguage(code: LanguageCode | null) {
  if (typeof localStorage === "undefined") return;
  if (code) localStorage.setItem(LOCK_KEY, code);
  else localStorage.removeItem(LOCK_KEY);
}

export function onLanguageChange(cb: Listener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getLanguageProfile(code?: LanguageCode) {
  return getLanguage(code ?? getCurrentLanguage());
}
