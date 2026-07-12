// Beta User Segments — who we open the beta to.

import type { BetaAccessLevelId } from "./betaAccessLevels";

export type BetaUserSegmentId =
  | "FOUNDER_SELF"
  | "TRUSTED_EXPERT"
  | "CREATOR"
  | "REFLECTIVE_PERSONAL"
  | "PROFESSIONAL_DECISION"
  | "RESEARCH"
  | "ENTERPRISE_ADJACENT";

export interface BetaUserSegment {
  id: BetaUserSegmentId;
  cn: string;
  en: string;
  desc: string;
  fitScore: number;
  riskScore: number;
  feedbackQuality: "LOW" | "MEDIUM" | "HIGH";
  onboardingDifficulty: "LOW" | "MEDIUM" | "HIGH";
  privacySensitivity: "LOW" | "MEDIUM" | "HIGH";
  misuseRisk: "LOW" | "MEDIUM" | "HIGH";
  recommendedAccessLevels: BetaAccessLevelId[];
  inviteCopyType:
    | "trusted_expert"
    | "creator"
    | "research"
    | "personal_reflection"
    | "enterprise_safe"
    | "founder";
}

export const BETA_USER_SEGMENTS: Record<BetaUserSegmentId, BetaUserSegment> = {
  FOUNDER_SELF: {
    id: "FOUNDER_SELF",
    cn: "创始人自测",
    en: "Founder Self-Test",
    desc: "创始人本人，用于完整跑通 60 组、回验权重与定数判断。",
    fitScore: 95,
    riskScore: 10,
    feedbackQuality: "HIGH",
    onboardingDifficulty: "LOW",
    privacySensitivity: "HIGH",
    misuseRisk: "LOW",
    recommendedAccessLevels: [
      "L0_DEMO",
      "L1_LIGHT20",
      "L2_FULL60",
      "L3_FEEDBACK",
      "L4_PROMPT",
      "L5_ADVANCED",
      "L6_RESEARCH",
    ],
    inviteCopyType: "founder",
  },
  TRUSTED_EXPERT: {
    id: "TRUSTED_EXPERT",
    cn: "可信专家用户",
    en: "Trusted Expert Users",
    desc: "理解复杂系统、能给出高质量反馈的少数可信用户。",
    fitScore: 86,
    riskScore: 22,
    feedbackQuality: "HIGH",
    onboardingDifficulty: "MEDIUM",
    privacySensitivity: "HIGH",
    misuseRisk: "LOW",
    recommendedAccessLevels: ["L0_DEMO", "L1_LIGHT20", "L2_FULL60", "L3_FEEDBACK", "L4_PROMPT"],
    inviteCopyType: "trusted_expert",
  },
  CREATOR: {
    id: "CREATOR",
    cn: "创作者 / 独立开发者",
    en: "Creator / Indie Hacker",
    desc: "适合测试 Prompt Forge、产品活性、发布窗口。",
    fitScore: 78,
    riskScore: 30,
    feedbackQuality: "MEDIUM",
    onboardingDifficulty: "MEDIUM",
    privacySensitivity: "MEDIUM",
    misuseRisk: "MEDIUM",
    recommendedAccessLevels: ["L0_DEMO", "L1_LIGHT20", "L4_PROMPT"],
    inviteCopyType: "creator",
  },
  REFLECTIVE_PERSONAL: {
    id: "REFLECTIVE_PERSONAL",
    cn: "自我探索个人用户",
    en: "Reflective Personal Users",
    desc: "适合测试触发日历、关系/事业/身体窗口与回验。",
    fitScore: 70,
    riskScore: 45,
    feedbackQuality: "MEDIUM",
    onboardingDifficulty: "HIGH",
    privacySensitivity: "HIGH",
    misuseRisk: "MEDIUM",
    recommendedAccessLevels: ["L0_DEMO", "L1_LIGHT20"],
    inviteCopyType: "personal_reflection",
  },
  PROFESSIONAL_DECISION: {
    id: "PROFESSIONAL_DECISION",
    cn: "专业决策用户",
    en: "Professional Decision Users",
    desc: "适合测试事业、项目、申请、产品判断。",
    fitScore: 74,
    riskScore: 38,
    feedbackQuality: "HIGH",
    onboardingDifficulty: "MEDIUM",
    privacySensitivity: "MEDIUM",
    misuseRisk: "MEDIUM",
    recommendedAccessLevels: ["L0_DEMO", "L1_LIGHT20", "L2_FULL60"],
    inviteCopyType: "trusted_expert",
  },
  RESEARCH: {
    id: "RESEARCH",
    cn: "研究 / 高校用户",
    en: "Research / University Users",
    desc: "适合测试方法论文档、回验协议、理论理解。",
    fitScore: 82,
    riskScore: 18,
    feedbackQuality: "HIGH",
    onboardingDifficulty: "LOW",
    privacySensitivity: "MEDIUM",
    misuseRisk: "LOW",
    recommendedAccessLevels: ["L0_DEMO", "L2_FULL60", "L6_RESEARCH"],
    inviteCopyType: "research",
  },
  ENTERPRISE_ADJACENT: {
    id: "ENTERPRISE_ADJACENT",
    cn: "企业邻近用户",
    en: "Enterprise-Adjacent",
    desc: "不开放命运化语言，仅开放 Decision Timing / Scenario Trigger。",
    fitScore: 60,
    riskScore: 50,
    feedbackQuality: "MEDIUM",
    onboardingDifficulty: "MEDIUM",
    privacySensitivity: "HIGH",
    misuseRisk: "MEDIUM",
    recommendedAccessLevels: ["L7_ENTERPRISE"],
    inviteCopyType: "enterprise_safe",
  },
};

export const BETA_USER_SEGMENT_LIST = Object.values(BETA_USER_SEGMENTS);
