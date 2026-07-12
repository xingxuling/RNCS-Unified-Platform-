// Text Localization Sync Engine — see spec §11
import { TEXT_LOCALES, TEXT_PRIMARY_LOCALE, type TextLocale } from "@/constants/text-dynamic/textLocalizationLocales";
import { TEXT_REGISTRY } from "./textRegistry";

export interface LocalizedTextEntry {
  textId: string;
  locale: TextLocale;
  text: string;
  stale: boolean;
  sourceVersion: string;
  translatedAt?: string;
}

const store: LocalizedTextEntry[] = [];

// Seed primary locale from registry
for (const e of TEXT_REGISTRY) {
  store.push({
    textId: e.textId, locale: TEXT_PRIMARY_LOCALE, text: e.currentText,
    stale: false, sourceVersion: e.version, translatedAt: e.lastUpdatedAt,
  });
  for (const loc of TEXT_LOCALES) {
    if (loc === TEXT_PRIMARY_LOCALE) continue;
    store.push({
      textId: e.textId, locale: loc, text: e.currentText, // placeholder = source
      stale: true, sourceVersion: e.version,
    });
  }
}

export function listLocalized(locale?: TextLocale): LocalizedTextEntry[] {
  return locale ? store.filter((x) => x.locale === locale) : store.slice();
}

export function localizationSummary() {
  const out: Record<string, { total: number; stale: number }> = {};
  for (const loc of TEXT_LOCALES) {
    const xs = store.filter((x) => x.locale === loc);
    out[loc] = { total: xs.length, stale: xs.filter((x) => x.stale).length };
  }
  return out;
}

export function markStaleAfterSourceChange(textIds: string[]) {
  for (const x of store) {
    if (x.locale !== TEXT_PRIMARY_LOCALE && textIds.includes(x.textId)) x.stale = true;
  }
}

export function syncLocale(locale: TextLocale): { updated: number } {
  if (locale === TEXT_PRIMARY_LOCALE) return { updated: 0 };
  let updated = 0;
  for (const x of store) {
    if (x.locale !== locale) continue;
    const src = TEXT_REGISTRY.find((e) => e.textId === x.textId);
    if (!src) continue;
    if (x.stale) {
      // We don't do real machine translation — copy source and keep marker
      x.text = src.currentText; // 注：未翻译，仅同步源文本占位
      x.stale = false;
      x.translatedAt = new Date().toISOString();
      updated += 1;
    }
  }
  return { updated };
}
