// 入门摩擦类型 · Onboarding Friction Types
export type OnboardingFrictionType =
  | "TOO_MUCH_INFO_FIRST_SCREEN"
  | "TOO_MANY_BUTTONS"
  | "TOO_MANY_TERMS"
  | "REQUIRES_MODEL_FIRST"
  | "REQUIRES_COMPLEX_INPUT"
  | "NO_DEMO"
  | "NO_NEXT_ACTION"
  | "MOBILE_TOO_COMPLEX"
  | "ADVANCED_FEATURE_OVEREXPOSED"
  | "SAFETY_TEXT_TOO_LONG";

export interface OnboardingFrictionMeta {
  key: OnboardingFrictionType;
  cn: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  suggestion: string;
}

export const ONBOARDING_FRICTION_META: Record<OnboardingFrictionType, OnboardingFrictionMeta> = {
  TOO_MUCH_INFO_FIRST_SCREEN: {
    key: "TOO_MUCH_INFO_FIRST_SCREEN", cn: "首屏信息过多",
    description: "首屏卡片/模块数量超过用户初次承载力。",
    severity: "HIGH", suggestion: "首屏只回答：这是什么 / 我能做什么 / 第一步点哪里。",
  },
  TOO_MANY_BUTTONS: {
    key: "TOO_MANY_BUTTONS", cn: "按钮过多",
    description: "首屏可点击项 > 5，造成选择焦虑。",
    severity: "MEDIUM", suggestion: "保留 1 主 + 2 副按钮。",
  },
  TOO_MANY_TERMS: {
    key: "TOO_MANY_TERMS", cn: "术语过密",
    description: "新手首屏出现高阶术语 ≥ 3 个。",
    severity: "HIGH", suggestion: "替换为用户语言或隐藏到高级模式。",
  },
  REQUIRES_MODEL_FIRST: {
    key: "REQUIRES_MODEL_FIRST", cn: "强制先建模",
    description: "未体验前要求创建个人模型。",
    severity: "HIGH", suggestion: "先 Demo，后建模。",
  },
  REQUIRES_COMPLEX_INPUT: {
    key: "REQUIRES_COMPLEX_INPUT", cn: "要求复杂输入",
    description: "一上来要求填入 Full 60 或大量数据。",
    severity: "CRITICAL", suggestion: "新用户路径只暴露 Light 20 或纯 Demo。",
  },
  NO_DEMO: {
    key: "NO_DEMO", cn: "缺少 Demo 入口",
    description: "首屏没有清晰的 Demo 体验按钮。",
    severity: "HIGH", suggestion: "提供「体验 Demo」主按钮。",
  },
  NO_NEXT_ACTION: {
    key: "NO_NEXT_ACTION", cn: "缺少下一步",
    description: "当前阶段没有明确的下一步推荐。",
    severity: "MEDIUM", suggestion: "每个阶段只推荐一个 Next Best Action。",
  },
  MOBILE_TOO_COMPLEX: {
    key: "MOBILE_TOO_COMPLEX", cn: "移动端过复杂",
    description: "移动端入门流程 > 4 步。",
    severity: "HIGH", suggestion: "压缩为 4 步以内。",
  },
  ADVANCED_FEATURE_OVEREXPOSED: {
    key: "ADVANCED_FEATURE_OVEREXPOSED", cn: "高级功能暴露过早",
    description: "新手模式下显示 Full 60 / QA / 重算等高级模块。",
    severity: "HIGH", suggestion: "收起到「显示高级功能」开关后。",
  },
  SAFETY_TEXT_TOO_LONG: {
    key: "SAFETY_TEXT_TOO_LONG", cn: "安全说明过长",
    description: "首屏安全声明 > 2 段，造成劝退。",
    severity: "LOW", suggestion: "保留一句话边界，详细放文档。",
  },
};
