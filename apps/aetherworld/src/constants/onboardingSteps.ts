// 入门流程步骤定义
export interface OnboardingStep {
  id: string;
  cn: string;
  description: string;
  maxSeconds: number;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: "choose_entry",   cn: "选择体验方式", description: "Demo / 轻量模型 / 高级用户", maxSeconds: 10 },
  { id: "choose_concern", cn: "选择你关心的问题", description: "关系 / 事业 / 创作 / 健康 / 学业 / 其他", maxSeconds: 15 },
  { id: "view_sample",    cn: "查看一个示例判断", description: "状态 + 建议 + 解释", maxSeconds: 20 },
  { id: "next_step",      cn: "下一步动作", description: "继续了解 / 记录结果 / 创建模型", maxSeconds: 15 },
];

export const ONBOARDING_MAX_STEPS = 4;
export const ONBOARDING_TARGET_SECONDS = 60;

// 关心的问题分类
export const ONBOARDING_CONCERNS = [
  { id: "relationship", cn: "关系" },
  { id: "career",       cn: "事业" },
  { id: "product",      cn: "产品 / 创作" },
  { id: "body",         cn: "身体状态" },
  { id: "study",        cn: "学业 / 申请" },
  { id: "other",        cn: "其他" },
] as const;

// 示例判断（每个关心问题一个）
export const ONBOARDING_SAMPLE_VERDICTS: Record<string, {
  status: string; suggestion: string; why: string;
}> = {
  relationship: { status: "半定",     suggestion: "小步推进",   why: "信号在变清楚，但还差一次现实反馈。" },
  career:       { status: "越来越明确", suggestion: "可以推进", why: "结构已经形成，建议在窗口期内执行。" },
  product:      { status: "还没定",   suggestion: "先观察",     why: "市场信号尚不一致，再积累一轮反馈更稳。" },
  body:         { status: "需要恢复", suggestion: "先休息",     why: "负荷信号偏高，强推会损耗后续窗口。" },
  study:        { status: "半定",     suggestion: "继续准备",   why: "外部反馈尚未给到，但条件在累积。" },
  other:        { status: "还没定",   suggestion: "先观察",     why: "信号还不够稳定，建议再看一下。" },
};
