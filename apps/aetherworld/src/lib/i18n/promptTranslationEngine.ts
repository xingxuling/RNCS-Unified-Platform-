import { LanguageCode } from "@/constants/i18n/supportedLanguages";

export type PromptTranslationPreset =
  | "translate_prompt"
  | "localize_product"
  | "translate_to_en"
  | "translate_to_ja"
  | "translate_to_ko"
  | "translate_to_fr"
  | "simp_to_trad"
  | "trad_to_simp"
  | "founder_term_lock";

export interface PromptTranslationOptions {
  preset: PromptTranslationPreset;
  sourceText: string;
  targetLanguage?: LanguageCode;
  preserveTerms?: string[];
}

export function buildTranslationPrompt(o: PromptTranslationOptions): string {
  const preserve = (o.preserveTerms ?? []).join("、");
  const head: Record<PromptTranslationPreset, string> = {
    translate_prompt:  "# Translate this prompt while preserving role/task structure:\n",
    localize_product:  "# Localize this product copy to feel native, not literal:\n",
    translate_to_en:   "# Translate to English (professional, product-oriented):\n",
    translate_to_ja:   "# 以下を自然な日本語（柔らかい・丁寧）に翻訳：\n",
    translate_to_ko:   "# 다음을 자연스러운 한국어(간결, 제품 톤)로 번역:\n",
    translate_to_fr:   "# Traduire en français clair et rationnel :\n",
    simp_to_trad:      "# 將以下簡體中文轉為自然繁體中文（不要直接逐字轉換）：\n",
    trad_to_simp:      "# 将以下繁体中文转为自然简体中文：\n",
    founder_term_lock: "# Lock the following founder-defined product terms; do NOT translate them:\n",
  };
  const lang = o.targetLanguage ? `\nTarget language: ${o.targetLanguage}\n` : "";
  const lock = preserve ? `\nPreserve terms (do not translate): ${preserve}\n` : "";
  return `${head[o.preset]}${lang}${lock}\n---\n${o.sourceText}\n---\n\nRules:\n- 保留产品术语\n- 保留安全边界与免责说明\n- 不要把“可能”翻成“一定”\n- 不要把虚拟生活翻成现实替代\n`;
}
