import type { QuestionType, CalibrationWeightPreset } from "@/constants/reality-data/realityCalibrationWeights";
import { CALIBRATION_WEIGHT_PRESETS, presetFor } from "@/constants/reality-data/realityCalibrationWeights";

export interface CalibrationPlan extends CalibrationWeightPreset {
  detectedKeywords: string[];
}

const KEYWORD_RULES: { type: QuestionType; keywords: string[] }[] = [
  { type: "MEDICAL_LEGAL_FINANCIAL", keywords: ["医疗", "诊断", "法律", "金融", "投资", "股票", "medical", "legal", "financial"] },
  { type: "POLICY_MARKET_RANKING",   keywords: ["排名", "ranking", "政策", "policy", "市场", "market", "新闻", "最新", "现在", "2025", "2026", "榜单"] },
  { type: "BUSINESS_ANALYSIS",       keywords: ["商业", "公司", "竞品", "产品", "营收", "增长", "business", "competitor"] },
  { type: "PERSONAL_DECISION",       keywords: ["我要", "我该", "我现在", "个人", "我的", "should i"] },
  { type: "VIRTUAL_WORLD",           keywords: ["虚拟", "虚构", "世界观", "剧情", "lore", "fiction"] },
];

export function classifyQuestion(text: string): QuestionType {
  const t = text.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((k) => t.includes(k.toLowerCase()))) return rule.type;
  }
  return "PURE_CREATION";
}

export function planCalibration(question: string): CalibrationPlan {
  const type = classifyQuestion(question);
  const preset = presetFor(type);
  const lower = question.toLowerCase();
  const detected = KEYWORD_RULES.flatMap((r) => r.keywords).filter((k) => lower.includes(k.toLowerCase()));
  return { ...preset, detectedKeywords: detected };
}

export function listAllPresets(): CalibrationWeightPreset[] { return CALIBRATION_WEIGHT_PRESETS; }
