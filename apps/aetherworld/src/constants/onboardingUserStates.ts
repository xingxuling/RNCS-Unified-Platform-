// 入门用户阶段 · Onboarding User States
export type OnboardingStage =
  | "FRESH_VISITOR"        // 第一次进入
  | "DEMO_VIEWED"          // 看过 Demo
  | "PREDICTION_OPENED"    // 看过预测详情
  | "FEEDBACK_LOGGED"      // 记录过结果
  | "LIGHT_MODEL_CREATED"  // 创建过 Light 20
  | "EXPERT";              // 已进入专家模式

export interface OnboardingStageMeta {
  key: OnboardingStage;
  cn: string;
  description: string;
  nextActionCN: string;
  nextActionUrl: string;
}

export const ONBOARDING_STAGE_META: Record<OnboardingStage, OnboardingStageMeta> = {
  FRESH_VISITOR: {
    key: "FRESH_VISITOR",
    cn: "首次进入",
    description: "尚未体验任何功能",
    nextActionCN: "体验 Demo",
    nextActionUrl: "/onboarding",
  },
  DEMO_VIEWED: {
    key: "DEMO_VIEWED",
    cn: "已看 Demo",
    description: "已了解基本输出形式",
    nextActionCN: "打开一个预测详情",
    nextActionUrl: "/calendar",
  },
  PREDICTION_OPENED: {
    key: "PREDICTION_OPENED",
    cn: "已看预测",
    description: "已了解一次完整判断",
    nextActionCN: "记录这次结果",
    nextActionUrl: "/feedback",
  },
  FEEDBACK_LOGGED: {
    key: "FEEDBACK_LOGGED",
    cn: "已记录结果",
    description: "已完成第一次回验闭环",
    nextActionCN: "创建我的轻量模型",
    nextActionUrl: "/subject",
  },
  LIGHT_MODEL_CREATED: {
    key: "LIGHT_MODEL_CREATED",
    cn: "已创建轻量模型",
    description: "已具备个人模型基础",
    nextActionCN: "查看未来 7 天",
    nextActionUrl: "/timeline",
  },
  EXPERT: {
    key: "EXPERT",
    cn: "专家模式",
    description: "可访问全部高级功能",
    nextActionCN: "进入主控台",
    nextActionUrl: "/",
  },
};

// localStorage key
export const ONBOARDING_STAGE_KEY = "aether.onboarding.stage.v1";
export const BEGINNER_MODE_KEY = "aether.beginner.mode.v1";

export function getOnboardingStage(): OnboardingStage {
  if (typeof window === "undefined") return "FRESH_VISITOR";
  try {
    const v = window.localStorage.getItem(ONBOARDING_STAGE_KEY);
    if (v && v in ONBOARDING_STAGE_META) return v as OnboardingStage;
  } catch { /* noop */ }
  return "FRESH_VISITOR";
}

export function setOnboardingStage(stage: OnboardingStage) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(ONBOARDING_STAGE_KEY, stage); } catch { /* noop */ }
}

export function isBeginnerMode(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = window.localStorage.getItem(BEGINNER_MODE_KEY);
    if (v === null) return true; // 默认开启
    return v === "1";
  } catch { return true; }
}

export function setBeginnerMode(on: boolean) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(BEGINNER_MODE_KEY, on ? "1" : "0"); } catch { /* noop */ }
}
