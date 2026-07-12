import { PRESENTATION_SAFETY_RULES, PRESENTATION_FORBIDDEN_CLAIMS } from "@/constants/sequence-world/presentation/presentationSafetyRules";

export interface PresentationSafetyCheck {
  passed: boolean;
  notes: string[];
  warnings: string[];
}

export function runPresentationSafetyCheck(opts: {
  subjectMode: string;
  exportTarget?: string;
  overAnimationRisk?: number;
  visualNoiseRisk?: number;
  reducedMotionSupported?: boolean;
}): PresentationSafetyCheck {
  const warnings: string[] = [];
  if (opts.subjectMode === "FULL_60") {
    warnings.push("Full60 表现层默认仅本地保存，请在导出前确认隐私边界。");
  }
  if ((opts.overAnimationRisk ?? 0) > 0.7) {
    warnings.push("动效强度偏高，请检查是否提供减弱动效选项。");
  }
  if ((opts.visualNoiseRisk ?? 0) > 0.7) {
    warnings.push("视觉噪音较高，请评估可读性。");
  }
  if (opts.reducedMotionSupported === false) {
    warnings.push("未启用 reduced motion 支持，建议补充。");
  }
  return {
    passed: warnings.length === 0,
    notes: PRESENTATION_SAFETY_RULES,
    warnings,
  };
}

export { PRESENTATION_SAFETY_RULES, PRESENTATION_FORBIDDEN_CLAIMS };
