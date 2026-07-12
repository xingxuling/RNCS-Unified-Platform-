import { VOCABULARY_REGISTRY, type VocabularyTerm } from "./vocabularyRegistry";

export type StaleTrigger =
  | "PRODUCT_ENCYCLOPEDIA_UPDATED"
  | "CALCULUS_UNIVERSE_UPDATED"
  | "LEARNING_DOCS_UPDATED"
  | "TEXT_REGISTRY_UPDATED"
  | "CONSTANT_UNIVERSE_UPDATED"
  | "SYSTEM_CONSTITUTION_UPDATED"
  | "ENGINE_REGISTRY_UPDATED"
  | "WORLD_ENGINE_UPDATED"
  | "SUBJECT_MODE_UPDATED"
  | "CURRENCY_RULES_UPDATED"
  | "SAFETY_RULES_UPDATED"
  | "LOCALIZATION_UPDATED";

export interface VocabularyStaleItem {
  termId: string;
  trigger: StaleTrigger;
  reason: string;
}

/** 根据触发事件返回所有受影响的 stale 词条。 */
export function detectStaleTerms(trigger: StaleTrigger): VocabularyStaleItem[] {
  const out: VocabularyStaleItem[] = [];
  const push = (cond: (t: VocabularyTerm) => boolean, reason: string) => {
    for (const t of VOCABULARY_REGISTRY) {
      if (cond(t)) out.push({ termId: t.termId, trigger, reason });
    }
  };
  switch (trigger) {
    case "CALCULUS_UNIVERSE_UPDATED":
      push((t) => t.category === "CALCULUS_TERM", "计算法宇宙更新");
      break;
    case "CONSTANT_UNIVERSE_UPDATED":
      push((t) => t.systemLayer === "GOVERNANCE_LAYER" || t.category === "GOVERNANCE_TERM", "常数宇宙更新");
      break;
    case "SYSTEM_CONSTITUTION_UPDATED":
      push((t) => t.category === "GOVERNANCE_TERM" || t.category === "SAFETY_TERM", "宪法更新");
      break;
    case "WORLD_ENGINE_UPDATED":
      push((t) => t.category === "WORLD_ENGINE_TERM", "世界引擎更新");
      break;
    case "TEXT_REGISTRY_UPDATED":
      push((t) => t.category === "TEXT_TERM", "文本注册表更新");
      break;
    case "LEARNING_DOCS_UPDATED":
      push((t) => t.category === "DOCS_TERM", "教程更新");
      break;
    case "PRODUCT_ENCYCLOPEDIA_UPDATED":
      push((t) => t.category === "CORE_SYSTEM_TERM", "产品百科更新");
      break;
    case "SUBJECT_MODE_UPDATED":
      push((t) => t.category === "SUBJECT_MODE_TERM" || t.category === "SEQUENCE_TERM", "主体模式更新");
      break;
    case "CURRENCY_RULES_UPDATED":
      push((t) => t.category === "CURRENCY_TERM", "货币规则更新");
      break;
    case "SAFETY_RULES_UPDATED":
      push((t) => t.category === "SAFETY_TERM", "安全规则更新");
      break;
    case "LOCALIZATION_UPDATED":
      push((t) => t.localization.length > 0, "本地化更新");
      break;
    case "ENGINE_REGISTRY_UPDATED":
      push((t) => t.systemLayer === "ENGINE_LAYER", "引擎注册表更新");
      break;
  }
  return out;
}
