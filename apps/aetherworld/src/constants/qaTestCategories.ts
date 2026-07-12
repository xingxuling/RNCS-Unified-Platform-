// QA Test Categories · 软件测试反馈问题分类

export type QACategory =
  | "ROUTE_MISSING"
  | "COMPONENT_MISSING"
  | "MODULE_NOT_INTEGRATED"
  | "DATA_ISOLATION_RISK"
  | "FEEDBACK_ENTRY_MISSING"
  | "SAFETY_BOUNDARY_MISSING"
  | "DOCUMENTATION_OUTDATED"
  | "STATE_DRIFT"
  | "STORAGE_ERROR"
  | "EMPTY_STATE_MISSING"
  | "USER_JOURNEY_BREAK"
  | "PROMPT_FORGE_NOT_UPDATED"
  | "ACCESS_CONTROL_MISSING"
  | "PRIVACY_WARNING_MISSING"
  | "REGRESSION_RISK"
  | "UNSAFE_ACCURACY_CLAIM"
  | "LANGUAGE_TOO_COMPLEX"
  | "JARGON_UNEXPLAINED"
  | "ENTERPRISE_LANGUAGE_RISK"
  | "DEMO_LANGUAGE_RISK"
  | "MOBILE_COPY_TOO_LONG"
  | "SAFETY_LANGUAGE_MISSING"
  | "ONBOARDING_TOO_COMPLEX"
  | "DEMO_ENTRY_MISSING"
  | "BEGINNER_MODE_MISSING"
  | "ADVANCED_FEATURE_OVEREXPOSED"
  | "NEXT_ACTION_MISSING";

export interface QACategoryMeta {
  key: QACategory;
  cn: string;
  en: string;
  description: string;
}

export const QA_CATEGORY_META: Record<QACategory, QACategoryMeta> = {
  ROUTE_MISSING: {
    key: "ROUTE_MISSING",
    cn: "路由缺失",
    en: "Route Missing",
    description: "页面在侧边栏存在，但路由不可达；或文件存在但未注册。",
  },
  COMPONENT_MISSING: {
    key: "COMPONENT_MISSING",
    cn: "组件缺失",
    en: "Component Missing",
    description: "页面引用组件不存在，或组件未接入。",
  },
  MODULE_NOT_INTEGRATED: {
    key: "MODULE_NOT_INTEGRATED",
    cn: "模块未接入",
    en: "Module Not Integrated",
    description: "计算法存在，但没有被页面、Prompt Forge、Beta Launch 或 Version Iteration 读取。",
  },
  DATA_ISOLATION_RISK: {
    key: "DATA_ISOLATION_RISK",
    cn: "数据隔离风险",
    en: "Data Isolation Risk",
    description: "Demo / Real / Full 60 / Imported 数据混用风险。",
  },
  FEEDBACK_ENTRY_MISSING: {
    key: "FEEDBACK_ENTRY_MISSING",
    cn: "回验入口缺失",
    en: "Feedback Entry Missing",
    description: "预测结果页或关键输出页没有回验入口。",
  },
  SAFETY_BOUNDARY_MISSING: {
    key: "SAFETY_BOUNDARY_MISSING",
    cn: "安全边界缺失",
    en: "Safety Boundary Missing",
    description: "高风险页面没有安全提示。",
  },
  DOCUMENTATION_OUTDATED: {
    key: "DOCUMENTATION_OUTDATED",
    cn: "文档过时",
    en: "Documentation Outdated",
    description: "产品文档未记录新模块或说明与实际功能不一致。",
  },
  STATE_DRIFT: {
    key: "STATE_DRIFT",
    cn: "状态漂移",
    en: "State Drift",
    description: "版本状态、Beta 状态、模块稳定状态互相矛盾。",
  },
  STORAGE_ERROR: {
    key: "STORAGE_ERROR",
    cn: "本地存储异常",
    en: "Local Storage Error",
    description: "localStorage key 缺失、污染、未隔离、无法清空。",
  },
  EMPTY_STATE_MISSING: {
    key: "EMPTY_STATE_MISSING",
    cn: "空状态缺失",
    en: "Empty State Missing",
    description: "用户没有数据时页面空白或不可理解。",
  },
  USER_JOURNEY_BREAK: {
    key: "USER_JOURNEY_BREAK",
    cn: "用户路径断裂",
    en: "User Journey Break",
    description: "从首页到 Demo、预测、回验、真实主体创建的流程断裂。",
  },
  PROMPT_FORGE_NOT_UPDATED: {
    key: "PROMPT_FORGE_NOT_UPDATED",
    cn: "Prompt Forge 未同步",
    en: "Prompt Forge Not Updated",
    description: "新模块没有被 Prompt Forge 读取或生成对应提示词。",
  },
  ACCESS_CONTROL_MISSING: {
    key: "ACCESS_CONTROL_MISSING",
    cn: "访问等级缺失",
    en: "Access Control Missing",
    description: "实验功能未按 Beta Access Level 控制。",
  },
  PRIVACY_WARNING_MISSING: {
    key: "PRIVACY_WARNING_MISSING",
    cn: "隐私提示缺失",
    en: "Privacy Warning Missing",
    description: "Full 60 / Imported / Real Subject 页面缺隐私提示。",
  },
  REGRESSION_RISK: {
    key: "REGRESSION_RISK",
    cn: "回归风险",
    en: "Regression Risk",
    description: "新功能可能破坏旧功能。",
  },
  UNSAFE_ACCURACY_CLAIM: {
    key: "UNSAFE_ACCURACY_CLAIM",
    cn: "准确率话术风险",
    en: "Unsafe Accuracy Claim",
    description: "页面出现「保证准确 / 必然发生 / 95% 已验证 / 绝对预测 / 直接照做」等高风险措辞。",
  },
  LANGUAGE_TOO_COMPLEX: {
    key: "LANGUAGE_TOO_COMPLEX",
    cn: "术语过密",
    en: "Language Too Complex",
    description: "页面术语密度过高，普通用户难以理解。",
  },
  JARGON_UNEXPLAINED: {
    key: "JARGON_UNEXPLAINED",
    cn: "术语未解释",
    en: "Jargon Unexplained",
    description: "高阶术语首次出现未附 tooltip 或解释。",
  },
  ENTERPRISE_LANGUAGE_RISK: {
    key: "ENTERPRISE_LANGUAGE_RISK",
    cn: "企业语言风险",
    en: "Enterprise Language Risk",
    description: "企业模式页面出现命运化或神秘化语言（命运 / 算命 / 奇点 / 主体命运 等）。",
  },
  DEMO_LANGUAGE_RISK: {
    key: "DEMO_LANGUAGE_RISK",
    cn: "Demo 语言风险",
    en: "Demo Language Risk",
    description: "Demo 模式让用户误以为是其真实命运。",
  },
  MOBILE_COPY_TOO_LONG: {
    key: "MOBILE_COPY_TOO_LONG",
    cn: "移动端文案过长",
    en: "Mobile Copy Too Long",
    description: "移动端卡片或按钮文案过长，应替换为 microcopy。",
  },
  SAFETY_LANGUAGE_MISSING: {
    key: "SAFETY_LANGUAGE_MISSING",
    cn: "安全边界语言缺失",
    en: "Safety Language Missing",
    description: "高风险表达缺少安全边界提示。",
  },
  ONBOARDING_TOO_COMPLEX: {
    key: "ONBOARDING_TOO_COMPLEX",
    cn: "入门流程过复杂",
    en: "Onboarding Too Complex",
    description: "新用户入门流程超过 4 步或入门流畅度 < 70。",
  },
  DEMO_ENTRY_MISSING: {
    key: "DEMO_ENTRY_MISSING",
    cn: "Demo 入口缺失",
    en: "Demo Entry Missing",
    description: "首屏没有清晰的 Demo 体验按钮。",
  },
  BEGINNER_MODE_MISSING: {
    key: "BEGINNER_MODE_MISSING",
    cn: "新手模式缺失",
    en: "Beginner Mode Missing",
    description: "缺少新手 / 高级模式切换；新用户被迫面对全部模块。",
  },
  ADVANCED_FEATURE_OVEREXPOSED: {
    key: "ADVANCED_FEATURE_OVEREXPOSED",
    cn: "高级功能暴露过早",
    en: "Advanced Feature Overexposed",
    description: "新手首屏出现 Full 60、QA、重算等高级模块。",
  },
  NEXT_ACTION_MISSING: {
    key: "NEXT_ACTION_MISSING",
    cn: "下一步动作缺失",
    en: "Next Action Missing",
    description: "当前阶段没有明确的 Next Best Action 推荐。",
  },
};
