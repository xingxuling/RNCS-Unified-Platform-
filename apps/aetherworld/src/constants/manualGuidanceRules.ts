// 使用手册计算法 · 规则定义
// 每条规则定义在特定页面 / 主体模式 / 用户阶段下，应触发何种使用指导

export type CurrentPage =
  | "Dashboard"
  | "Subject Model"
  | "Real Subject"
  | "Trigger Calendar"
  | "Prediction Detail"
  | "Feedback Center"
  | "Prompt Forge"
  | "Regional UX"
  | "Beta Launch"
  | "Version Iteration"
  | "Documentation"
  | "Constants"
  | "Geo Analysis"
  | "Product Vitality"
  | "Usage & Safety"
  | "Software QA";

export type UserStage =
  | "FIRST_VISIT"
  | "DEMO_EXPLORING"
  | "CREATING_SUBJECT"
  | "VIEWING_PREDICTION"
  | "SUBMITTING_FEEDBACK"
  | "ADVANCED_USER"
  | "BETA_TESTER";

export type ComplexityLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type DocExposure = "NONE" | "PARTIAL" | "SUFFICIENT";

export type GuidanceType =
  | "NONE"
  | "TOOLTIP"
  | "INLINE_HINT"
  | "BANNER"
  | "MODAL"
  | "BLOCKING_CONFIRMATION";

export interface ManualGuidanceRule {
  page: CurrentPage;
  title: string;
  message: string;
  actionLabel?: string;
  linkToDocs?: string;
  baseFeatureComplexity: ComplexityLevel;
  baseMisuseRisk: RiskLevel;
  baseSafetyNeed: RiskLevel;
  baseFeedbackNeed: RiskLevel;
  /** 在 FULL_60 模式且首次时，是否需要阻塞式确认 */
  requiresAcknowledgementOnFull60?: boolean;
}

export const MANUAL_GUIDANCE_RULES: ManualGuidanceRule[] = [
  {
    page: "Dashboard",
    title: "如何使用主控台",
    message:
      "先查看今日定数与行动许可，再决定是否进入预测详情或回验。",
    actionLabel: "查看使用手册",
    linkToDocs: "/usage-safety",
    baseFeatureComplexity: "LOW",
    baseMisuseRisk: "LOW",
    baseSafetyNeed: "LOW",
    baseFeedbackNeed: "MEDIUM",
  },
  {
    page: "Subject Model",
    title: "主体模型与隐私",
    message:
      "真实主体数据属于敏感个人数据，请确认你理解 Demo 与真实主体的区别。",
    linkToDocs: "/usage-safety",
    baseFeatureComplexity: "MEDIUM",
    baseMisuseRisk: "MEDIUM",
    baseSafetyNeed: "MEDIUM",
    baseFeedbackNeed: "LOW",
  },
  {
    page: "Real Subject",
    title: "真实主体 · 高敏感",
    message:
      "Full 60 完整主体数列属于高敏感主体数据，仅建议可信用户或深度自用场景使用。当前数据默认保存在本地 localStorage，可随时删除或导出。不要把真实数列当作公开 Demo。",
    actionLabel: "我已理解",
    linkToDocs: "/usage-safety",
    baseFeatureComplexity: "EXTREME",
    baseMisuseRisk: "HIGH",
    baseSafetyNeed: "HIGH",
    baseFeedbackNeed: "HIGH",
    requiresAcknowledgementOnFull60: true,
  },
  {
    page: "Trigger Calendar",
    title: "如何阅读触发日历",
    message:
      "触发日历表示结构触发强度，不代表当天必然发生事件。请结合定数判断与回验结果使用。",
    linkToDocs: "/usage-safety",
    baseFeatureComplexity: "MEDIUM",
    baseMisuseRisk: "MEDIUM",
    baseSafetyNeed: "MEDIUM",
    baseFeedbackNeed: "MEDIUM",
  },
  {
    page: "Prediction Detail",
    title: "如何使用预测详情",
    message:
      "预测详情用于辅助判断时间窗口、事件类型与行动许可。请不要把预测结果作为重大决策的唯一依据。",
    actionLabel: "提交回验",
    linkToDocs: "/usage-safety",
    baseFeatureComplexity: "HIGH",
    baseMisuseRisk: "HIGH",
    baseSafetyNeed: "HIGH",
    baseFeedbackNeed: "HIGH",
  },
  {
    page: "Feedback Center",
    title: "回验是系统进化的核心",
    message:
      "没有回验，预测不会真正贴近主体。每一次回验都会修正未来预测的权重。",
    linkToDocs: "/usage-safety",
    baseFeatureComplexity: "MEDIUM",
    baseMisuseRisk: "LOW",
    baseSafetyNeed: "LOW",
    baseFeedbackNeed: "HIGH",
  },
  {
    page: "Prompt Forge",
    title: "提示词锻造的边界",
    message:
      "提示词锻造炉生成的是行动提示词，不保证外部工具一定成功。请根据输出结果回验提示词有效性。",
    linkToDocs: "/usage-safety",
    baseFeatureComplexity: "HIGH",
    baseMisuseRisk: "MEDIUM",
    baseSafetyNeed: "MEDIUM",
    baseFeedbackNeed: "MEDIUM",
  },
  {
    page: "Regional UX",
    title: "地区用户体验",
    message:
      "地区策略仅作为体验调整建议，不代表对该地区所有用户的判断。",
    linkToDocs: "/docs",
    baseFeatureComplexity: "MEDIUM",
    baseMisuseRisk: "LOW",
    baseSafetyNeed: "LOW",
    baseFeedbackNeed: "LOW",
  },
  {
    page: "Beta Launch",
    title: "内测发布边界",
    message:
      "内测发布计算法用于判断是否适合小范围测试，不代表公开发布许可。",
    linkToDocs: "/usage-safety",
    baseFeatureComplexity: "HIGH",
    baseMisuseRisk: "HIGH",
    baseSafetyNeed: "HIGH",
    baseFeedbackNeed: "MEDIUM",
  },
  {
    page: "Version Iteration",
    title: "版本迭代闸口",
    message:
      "版本判断结果用于团队内部决策，不构成对外发布承诺。",
    linkToDocs: "/usage-safety",
    baseFeatureComplexity: "HIGH",
    baseMisuseRisk: "MEDIUM",
    baseSafetyNeed: "HIGH",
    baseFeedbackNeed: "MEDIUM",
  },
  {
    page: "Geo Analysis",
    title: "地理因素的边界",
    message:
      "地理因素提供结构补充信号，不能单独作为重大行动依据。",
    linkToDocs: "/usage-safety",
    baseFeatureComplexity: "MEDIUM",
    baseMisuseRisk: "MEDIUM",
    baseSafetyNeed: "MEDIUM",
    baseFeedbackNeed: "MEDIUM",
  },
  {
    page: "Product Vitality",
    title: "产品活性",
    message:
      "产品活性指标用于内部评估，不能视作市场或财务结论。",
    linkToDocs: "/usage-safety",
    baseFeatureComplexity: "MEDIUM",
    baseMisuseRisk: "MEDIUM",
    baseSafetyNeed: "MEDIUM",
    baseFeedbackNeed: "LOW",
  },
  {
    page: "Constants",
    title: "常数宇宙",
    message: "常数库为结构常量库，不直接构成预测结论。",
    linkToDocs: "/docs",
    baseFeatureComplexity: "LOW",
    baseMisuseRisk: "LOW",
    baseSafetyNeed: "LOW",
    baseFeedbackNeed: "LOW",
  },
  {
    page: "Documentation",
    title: "产品文档",
    message: "建议按 总览 → 使用手册 → 计算法 → 安全边界 顺序阅读。",
    baseFeatureComplexity: "LOW",
    baseMisuseRisk: "LOW",
    baseSafetyNeed: "LOW",
    baseFeedbackNeed: "LOW",
  },
  {
    page: "Usage & Safety",
    title: "使用与安全",
    message: "这是阅读使用手册和安全边界的核心入口。",
    baseFeatureComplexity: "LOW",
    baseMisuseRisk: "LOW",
    baseSafetyNeed: "LOW",
    baseFeedbackNeed: "LOW",
  },
];

export const COMPLEXITY_SCORE: Record<ComplexityLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  EXTREME: 4,
};

export const RISK_SCORE: Record<RiskLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

export const EXPOSURE_SCORE: Record<DocExposure, number> = {
  NONE: 1,
  PARTIAL: 1.6,
  SUFFICIENT: 2.4,
};

export const STAGE_FAMILIARITY_SCORE: Record<UserStage, number> = {
  FIRST_VISIT: 1,
  DEMO_EXPLORING: 1.2,
  CREATING_SUBJECT: 1.4,
  VIEWING_PREDICTION: 1.5,
  SUBMITTING_FEEDBACK: 1.8,
  ADVANCED_USER: 2.2,
  BETA_TESTER: 2.6,
};
