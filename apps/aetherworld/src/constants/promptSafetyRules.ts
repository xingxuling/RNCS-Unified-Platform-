// 提示词安全规则 · Prompt Safety Rules
export interface PromptSafetyRule {
  id: string;
  cn: string;
  appliesTo: string[]; // domain id
  enforcement: "BLOCK" | "WARN" | "REWRITE";
}

export const PROMPT_SAFETY_RULES: PromptSafetyRule[] = [
  { id: "no_medical_diagnosis",  cn: "不生成医疗诊断 / 处方提示词。",      appliesTo: ["health_routine","cognitive_recovery","neuroplasticity","fitness_planning"], enforcement: "BLOCK" },
  { id: "no_legal_conclusion",   cn: "不生成法律结论性提示词。",            appliesTo: ["legal_admin","enterprise_decision"], enforcement: "BLOCK" },
  { id: "no_finance_guarantee",  cn: "不生成金融投资收益保证类提示词。",    appliesTo: ["finance_planning","fundraising"], enforcement: "BLOCK" },
  { id: "no_absolute_prediction",cn: "不生成绝对断言未来的提示词。",        appliesTo: ["prediction_forecast","ritual_symbol"], enforcement: "REWRITE" },
  { id: "no_full60_disclosure",  cn: "不公开真实 Full 60 数列原值。",        appliesTo: ["prediction_forecast","personal_os"], enforcement: "BLOCK" },
  { id: "demo_real_isolation",   cn: "不把 Demo 数据当真实用户数据。",      appliesTo: ["product_design","ux_ui","qa_testing"], enforcement: "WARN" },
  { id: "enterprise_defate",     cn: "企业模式必须去命运化语言。",          appliesTo: ["enterprise_decision","finance_planning","legal_admin"], enforcement: "REWRITE" },
  { id: "user_jargon_density",   cn: "普通用户模式必须降低术语密度。",      appliesTo: ["ux_ui","copywriting","documentation","personal_productivity"], enforcement: "REWRITE" },
  { id: "no_manipulation",       cn: "不生成操控他人 / 越界关系类提示词。",  appliesTo: ["relationship_analysis","social_strategy"], enforcement: "BLOCK" },
];

export function rulesFor(domainId: string) {
  return PROMPT_SAFETY_RULES.filter((r) => r.appliesTo.includes(domainId));
}
