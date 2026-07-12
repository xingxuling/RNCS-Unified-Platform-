import { LanguageCode } from "@/constants/i18n/supportedLanguages";

export interface UsageExampleI18n {
  id: string;
  title: Partial<Record<LanguageCode, string>>;
  inputTemplate: Partial<Record<LanguageCode, string>>;
  outputSummary?: Partial<Record<LanguageCode, string>>;
}

export const USAGE_EXAMPLE_FALLBACK_NOTE: Record<LanguageCode, string> = {
  "zh-CN": "该示例尚未完整翻译，当前为自动辅助版本。",
  "zh-HK": "此示例尚未完整翻譯，目前為自動輔助版本。",
  "zh-TW": "此範例尚未完整翻譯，目前為自動輔助版本。",
  en: "This example has not been fully translated yet; showing an auto-assisted version.",
  ja: "この例はまだ完全に翻訳されていません。自動補助版を表示しています。",
  ko: "이 예시는 아직 완전히 번역되지 않았습니다. 자동 보조 버전을 표시 중입니다.",
  fr: "Cet exemple n'est pas encore entièrement traduit ; version auto-assistée affichée.",
};

export function resolveExample(ex: UsageExampleI18n, lang: LanguageCode) {
  const title = ex.title[lang];
  const input = ex.inputTemplate[lang];
  const fallback = !title || !input;
  return {
    title: title ?? ex.title.en ?? ex.title["zh-CN"] ?? ex.id,
    inputTemplate: input ?? ex.inputTemplate.en ?? ex.inputTemplate["zh-CN"] ?? "",
    outputSummary: ex.outputSummary?.[lang] ?? ex.outputSummary?.en,
    fallback,
    fallbackNote: fallback ? USAGE_EXAMPLE_FALLBACK_NOTE[lang] : undefined,
  };
}

export const USAGE_EXAMPLE_I18N_SEED: UsageExampleI18n[] = [
  {
    id: "ex-omni-quick",
    title: {
      "zh-CN": "Omni 全域计算：一句话查询",
      "zh-HK": "Omni 全域計算：一句話查詢",
      "zh-TW": "Omni 全域計算：一句話查詢",
      en: "Omni Calculus: one-sentence query",
      ja: "Omni 全域計算：一文クエリ",
      ko: "Omni 전역 계산: 한 문장 질의",
      fr: "Omni Calculus : requête en une phrase",
    },
    inputTemplate: {
      "zh-CN": "我现在该做 A 还是 B？",
      en: "Should I do A or B right now?",
    },
  },
  {
    id: "ex-msl-55555",
    title: {
      "zh-CN": "MSL：解释 55555",
      en: "MSL: interpret 55555",
      ja: "MSL：55555 を解釈",
    },
    inputTemplate: { "zh-CN": "55555", en: "55555", ja: "55555" },
  },
];
