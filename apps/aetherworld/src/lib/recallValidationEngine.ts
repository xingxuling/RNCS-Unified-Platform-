import type { RecallFragment } from "./pastLifeRecallCalculus";
import { RECALL_VALIDATION_ITEMS, type RecallValidationItem } from "@/constants/recallValidationTypes";

export interface RecallValidationResult {
  item: RecallValidationItem;
  passed: boolean;
  hint: string;
}

export function validateRecall(f: RecallFragment): RecallValidationResult[] {
  return RECALL_VALIDATION_ITEMS.map(item => {
    let passed = false;
    let hint = "";
    switch (item.id) {
      case "RECURRENCE":
        passed = f.recurrenceFrequency >= 4;
        hint = passed ? "重复出现，可信度提升。" : "若仅一次，请先观察再下结论。";
        break;
      case "SYMBOL_CONSISTENCY":
        passed = f.symbols.length >= 2;
        hint = passed ? "符号已形成结构。" : "建议补充 2 个以上稳定符号。";
        break;
      case "CULTURAL_DISTANCE":
        passed = f.culturalDistance >= 6;
        hint = passed ? "与日常文化输入距离较远。" : "可能来自常接触的内容。";
        break;
      case "BODY_RESONANCE":
        passed = f.bodyResonance >= 5;
        hint = passed ? "存在可重复的身体反应。" : "身体反应不明显。";
        break;
      case "NON_FANTASY":
        passed = !/希望我是|我应该是/.test(f.description);
        hint = passed ? "未发现明显愿望投射。" : "请检查是否带有「希望自己是」的成分。";
        break;
      case "NO_MEDIA_SOURCE":
        passed = f.possibleExternalSources.length === 0;
        hint = passed ? "未发现外源。" : "存在可能的外部来源。";
        break;
      case "NO_DECISION_DEPENDENCY":
        passed = true;
        hint = "请确认未把此材料作为重大决定的唯一依据。";
        break;
      case "CREATIVE_VALUE":
        passed = f.imageIntensity >= 5 || f.narrativeCoherence >= 5;
        hint = passed ? "适合转为创作素材。" : "可作为长期观察对象。";
        break;
    }
    return { item, passed, hint };
  });
}
