// 事件回验引擎
import { getValidationRule, type EventValidationRule } from "@/constants/eventValidationRules";

export interface ValidationView {
  rule: EventValidationRule;
  /** 已勾选项数 / 总项数；UI 自行管理勾选态 */
  progress: (checked: number, total: number) => number;
}

export function getEventValidation(eventId: string): ValidationView {
  return {
    rule: getValidationRule(eventId),
    progress: (checked, total) => total === 0 ? 0 : Math.round((checked / total) * 100),
  };
}

/** 用于 Software QA：判断 feedback 记录是否带 eventAlgorithmId */
export function feedbackHasEventAlgorithm(record: any): boolean {
  return Boolean(record && record.eventAlgorithmId);
}
