// 入门使用流程简化引擎 · Onboarding Flow Simplification Engine
import {
  ONBOARDING_FRICTION_META,
  type OnboardingFrictionType,
} from "@/constants/onboardingFrictionTypes";
import { ONBOARDING_MAX_STEPS, ONBOARDING_TARGET_SECONDS } from "@/constants/onboardingSteps";

export interface OnboardingPageInput {
  pageId: string;
  isFirstScreen: boolean;
  buttonCount: number;
  highJargonCount: number;
  requiresModelFirst: boolean;
  requiresComplexInput: boolean;
  hasDemoEntry: boolean;
  hasNextAction: boolean;
  isMobile: boolean;
  mobileStepCount: number;
  advancedModulesVisible: number;
  safetyParagraphs: number;
}

export interface OnboardingFrictionResult {
  simplicityScore: number;
  blockers: string[];
  confusingSteps: string[];
  recommendedSimplifications: string[];
  detectedFrictions: OnboardingFrictionType[];
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Onboarding Simplicity Score:
 *  (FirstActionClarity × DemoAccessibility × ResultVisibility × LanguageSimplicity
 *   × SafetyClarity × NextStepClarity)
 *  / (FeatureOverload × JargonDensity × SetupFriction × DecisionAnxiety)
 */
export function evaluateOnboardingFriction(input: OnboardingPageInput): OnboardingFrictionResult {
  const detected: OnboardingFrictionType[] = [];
  const blockers: string[] = [];
  const confusing: string[] = [];
  const recs: string[] = [];

  // positive factors
  const firstActionClarity = input.hasNextAction ? 8 : 3;
  const demoAccessibility  = input.hasDemoEntry ? 8 : 2;
  const resultVisibility   = input.requiresComplexInput ? 3 : 8;
  const languageSimplicity = input.highJargonCount === 0 ? 9
                          : input.highJargonCount <= 2 ? 6
                          : 3;
  const safetyClarity      = input.safetyParagraphs <= 1 ? 8 : 5;
  const nextStepClarity    = input.hasNextAction ? 9 : 3;

  // negative factors (≥1)
  const featureOverload    = Math.max(1, input.advancedModulesVisible);
  const jargonDensity      = Math.max(1, input.highJargonCount);
  const setupFriction      = (input.requiresModelFirst ? 3 : 1) * (input.requiresComplexInput ? 4 : 1);
  const decisionAnxiety    = Math.max(1, Math.round(input.buttonCount / 2));

  const num = firstActionClarity * demoAccessibility * resultVisibility
            * languageSimplicity * safetyClarity * nextStepClarity;
  const den = featureOverload * jargonDensity * setupFriction * decisionAnxiety;

  const simplicityScore = clamp(Math.round(Math.log10(num / den + 1) * 32));

  // friction detection
  if (input.isFirstScreen && input.buttonCount > 5) {
    detected.push("TOO_MANY_BUTTONS");
    confusing.push(`首屏可点击项 ${input.buttonCount} 个，建议 ≤ 3。`);
  }
  if (input.highJargonCount >= 3) {
    detected.push("TOO_MANY_TERMS");
    blockers.push(`首屏出现 ${input.highJargonCount} 个高阶术语。`);
  }
  if (input.requiresModelFirst) {
    detected.push("REQUIRES_MODEL_FIRST");
    blockers.push("尚未体验就要求创建个人模型。");
  }
  if (input.requiresComplexInput) {
    detected.push("REQUIRES_COMPLEX_INPUT");
    blockers.push("一开始就要求复杂数据输入。");
  }
  if (!input.hasDemoEntry) {
    detected.push("NO_DEMO");
    blockers.push("缺少 Demo 体验按钮。");
  }
  if (!input.hasNextAction) {
    detected.push("NO_NEXT_ACTION");
    confusing.push("当前阶段没有明确的下一步。");
  }
  if (input.isMobile && input.mobileStepCount > ONBOARDING_MAX_STEPS) {
    detected.push("MOBILE_TOO_COMPLEX");
    blockers.push(`移动端入门 ${input.mobileStepCount} 步 > ${ONBOARDING_MAX_STEPS}。`);
  }
  if (input.advancedModulesVisible >= 4) {
    detected.push("ADVANCED_FEATURE_OVEREXPOSED");
    blockers.push(`首屏暴露了 ${input.advancedModulesVisible} 个高级模块。`);
  }
  if (input.safetyParagraphs > 2) {
    detected.push("SAFETY_TEXT_TOO_LONG");
    confusing.push("安全说明过长，建议精简。");
  }
  if (input.isFirstScreen && (input.buttonCount + input.advancedModulesVisible) > 8) {
    detected.push("TOO_MUCH_INFO_FIRST_SCREEN");
  }

  for (const f of detected) {
    recs.push(ONBOARDING_FRICTION_META[f].suggestion);
  }

  return {
    simplicityScore,
    blockers,
    confusingSteps: confusing,
    recommendedSimplifications: Array.from(new Set(recs)),
    detectedFrictions: detected,
  };
}

export const ONBOARDING_THRESHOLDS = {
  GUIDED_BETA_MIN: 70,
  V1_CANDIDATE_MIN: 75,
  TARGET_SECONDS: ONBOARDING_TARGET_SECONDS,
};

/** 默认评估当前首页（用于 Software QA / Beta Launch / Version Iteration 读取） */
export function defaultDashboardSnapshot(): OnboardingPageInput {
  return {
    pageId: "/",
    isFirstScreen: true,
    buttonCount: 3,
    highJargonCount: 1,
    requiresModelFirst: false,
    requiresComplexInput: false,
    hasDemoEntry: true,
    hasNextAction: true,
    isMobile: false,
    mobileStepCount: 4,
    advancedModulesVisible: 2,
    safetyParagraphs: 1,
  };
}
