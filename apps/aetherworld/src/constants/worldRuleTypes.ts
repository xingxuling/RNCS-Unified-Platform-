// 世界法则类型
export type WorldRuleTypeId =
  | "TIME_RULE" | "FIELD_RULE" | "HUMAN_RULE" | "MAINLINE_RULE"
  | "CHANGE_RULE" | "FEEDBACK_RULE" | "RISK_RULE" | "ACTION_RULE";

export interface WorldRuleType {
  id: WorldRuleTypeId;
  name: string;
  en: string;
  domain: string; // 来源五域
  baseExplanation: string;
  encyclopediaRef?: string;
}

export const WORLD_RULE_TYPES: WorldRuleType[] = [
  { id: "TIME_RULE",     name: "时间法则", en: "Time Rule",     domain: "tian",
    baseExplanation: "这个世界如何处理时机、周期、等待与触发。",
    encyclopediaRef: "time-window" },
  { id: "FIELD_RULE",    name: "场域法则", en: "Field Rule",    domain: "di",
    baseExplanation: "资源、平台、环境与制度如何影响世界。" },
  { id: "HUMAN_RULE",    name: "人域法则", en: "Human Rule",    domain: "ren",
    baseExplanation: "人物、关系、反馈与合作如何出现。" },
  { id: "MAINLINE_RULE", name: "主线法则", en: "Mainline Rule", domain: "shen",
    baseExplanation: "这个世界的长期方向与意义。" },
  { id: "CHANGE_RULE",   name: "变化法则", en: "Change Rule",   domain: "feng",
    baseExplanation: "变化、传播、转向与破局如何发生。" },
  { id: "FEEDBACK_RULE", name: "回验法则", en: "Feedback Rule", domain: "ren",
    baseExplanation: "现实反馈如何改变世界权重。",
    encyclopediaRef: "feedback-loop" },
  { id: "RISK_RULE",     name: "风险法则", en: "Risk Rule",     domain: "feng",
    baseExplanation: "这个世界常见的噪声、误读与过载。" },
  { id: "ACTION_RULE",   name: "行动法则", en: "Action Rule",   domain: "ren",
    baseExplanation: "用户在这个世界中最适合的行动方式。",
    encyclopediaRef: "action-permission" },
];
