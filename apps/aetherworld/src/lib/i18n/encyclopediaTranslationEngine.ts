import { LanguageCode } from "@/constants/i18n/supportedLanguages";

export interface EncyclopediaEntryI18n {
  id: string;
  title: Partial<Record<LanguageCode, string>>;
  summary: Partial<Record<LanguageCode, string>>;
  body?: Partial<Record<LanguageCode, string>>;
  terminologyLock?: boolean;
}

export function resolveEntry(entry: EncyclopediaEntryI18n, lang: LanguageCode) {
  const title = entry.title[lang] ?? entry.title.en ?? entry.title["zh-CN"] ?? entry.id;
  const summary = entry.summary[lang] ?? entry.summary.en ?? entry.summary["zh-CN"] ?? "";
  const body = entry.body?.[lang] ?? entry.body?.en ?? entry.body?.["zh-CN"];
  const fallback = !entry.title[lang] || !entry.summary[lang];
  return { title, summary, body, fallback };
}

export const ENCYCLOPEDIA_I18N_SEED: EncyclopediaEntryI18n[] = [
  {
    id: "mother-sequence-language",
    title:   { "zh-CN": "母体数列语言", en: "Mother Sequence Language", ja: "マザーシーケンス言語", ko: "마더 시퀀스 언어", fr: "Langage Séquence-Mère" },
    summary: { "zh-CN": "以五位数列为最小语句的状态驱动语言。", en: "A state-driven language whose minimum statement is a 5-digit sequence." },
    terminologyLock: true,
  },
  {
    id: "sequence-world-engine",
    title:   { "zh-CN": "数列驱动世界引擎", en: "Sequence-Driven World Engine" },
    summary: { "zh-CN": "把数列编译为世界状态/渲染/物理/NPC/任务。", en: "Compiles sequences into world state, rendering, physics, NPC and quest data." },
  },
];
