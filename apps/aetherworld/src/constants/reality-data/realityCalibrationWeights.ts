export type QuestionType =
  | "PURE_CREATION" | "PERSONAL_DECISION" | "BUSINESS_ANALYSIS"
  | "POLICY_MARKET_RANKING" | "MEDICAL_LEGAL_FINANCIAL" | "VIRTUAL_WORLD";

export interface CalibrationWeightPreset {
  questionType: QuestionType;
  label: string;
  subjectSequenceWeight: number;
  externalDataWeight: number;
  validationWeight: number;
  safetyWeight: number;
  shouldUseExternalData: boolean;
  requiredDataTypes: string[];
  reason: string;
}

export const CALIBRATION_WEIGHT_PRESETS: CalibrationWeightPreset[] = [
  { questionType: "PURE_CREATION",           label: "纯创作/世界观",   subjectSequenceWeight: 0.8,  externalDataWeight: 0.1,  validationWeight: 0.05, safetyWeight: 0.05, shouldUseExternalData: false, requiredDataTypes: [],                                       reason: "创作以主体数列为主。" },
  { questionType: "PERSONAL_DECISION",       label: "个人决策",         subjectSequenceWeight: 0.55, externalDataWeight: 0.25, validationWeight: 0.1,  safetyWeight: 0.1,  shouldUseExternalData: true,  requiredDataTypes: ["USER_PROVIDED", "PERSONAL_LOCAL_DATA"], reason: "个人决策结合主体与个人现实。" },
  { questionType: "BUSINESS_ANALYSIS",       label: "商业分析",         subjectSequenceWeight: 0.35, externalDataWeight: 0.45, validationWeight: 0.1,  safetyWeight: 0.1,  shouldUseExternalData: true,  requiredDataTypes: ["MARKET_DATA", "PRODUCT_USAGE_DATA"],   reason: "商业判断需现实数据支撑。" },
  { questionType: "POLICY_MARKET_RANKING",   label: "政策/市场/排名",   subjectSequenceWeight: 0.25, externalDataWeight: 0.55, validationWeight: 0.1,  safetyWeight: 0.1,  shouldUseExternalData: true,  requiredDataTypes: ["OFFICIAL_STATISTICS", "RANKING_DATA", "PUBLIC_WEB"], reason: "排名政策市场以外部为主。" },
  { questionType: "MEDICAL_LEGAL_FINANCIAL", label: "医疗/法律/金融",   subjectSequenceWeight: 0.05, externalDataWeight: 0.55, validationWeight: 0.1,  safetyWeight: 0.3,  shouldUseExternalData: true,  requiredDataTypes: ["OFFICIAL_STATISTICS", "ACADEMIC_DATA"],  reason: "高风险领域以外部权威为主并强化安全边界。" },
  { questionType: "VIRTUAL_WORLD",           label: "虚拟世界",         subjectSequenceWeight: 0.75, externalDataWeight: 0.05, validationWeight: 0.1,  safetyWeight: 0.1,  shouldUseExternalData: false, requiredDataTypes: [],                                       reason: "虚拟世界以内部为主。" },
];

export function presetFor(type: QuestionType): CalibrationWeightPreset {
  return CALIBRATION_WEIGHT_PRESETS.find((p) => p.questionType === type)!;
}
