// 用户语言层级 · User Language Levels
export type UserLanguageLevel =
  | "RAW_SYSTEM"
  | "PROFESSIONAL"
  | "USER_FRIENDLY"
  | "ACTION_ORIENTED"
  | "ENTERPRISE_SAFE"
  | "EDUCATIONAL"
  | "MICROCOPY";

export interface UserLanguageLevelMeta {
  key: UserLanguageLevel;
  cn: string;
  en: string;
  audience: string;
  example: string;
}

export const USER_LANGUAGE_LEVEL_META: Record<UserLanguageLevel, UserLanguageLevelMeta> = {
  RAW_SYSTEM: {
    key: "RAW_SYSTEM",
    cn: "系统原名",
    en: "Raw System",
    audience: "创始人 / 研究者 / 高阶用户 / 文档深层页",
    example: "定数计算法、分支塌缩、风域奇点",
  },
  PROFESSIONAL: {
    key: "PROFESSIONAL",
    cn: "专业产品语言",
    en: "Professional",
    audience: "企业 / 高校 / 投资人 / 深度用户",
    example: "最终状态判断、未来分支收束、信号质量分析",
  },
  USER_FRIENDLY: {
    key: "USER_FRIENDLY",
    cn: "普通用户语言",
    en: "User Friendly",
    audience: "主流程 / 预测详情 / 普通用户",
    example: "这件事正在变得更明确、当前判断状态",
  },
  ACTION_ORIENTED: {
    key: "ACTION_ORIENTED",
    cn: "行动语言",
    en: "Action Oriented",
    audience: "建议动作 / 决策提示",
    example: "先观察，不要急着做决定",
  },
  ENTERPRISE_SAFE: {
    key: "ENTERPRISE_SAFE",
    cn: "企业安全语言",
    en: "Enterprise Safe",
    audience: "企业 / 合规 / 完全去命运化",
    example: "Scenario narrowing、Decision state、Review loop",
  },
  EDUCATIONAL: {
    key: "EDUCATIONAL",
    cn: "教学解释语言",
    en: "Educational",
    audience: "学习 / 文档 / 内测",
    example: "“定数计算法”指系统判断一件事到底定没定的模块。",
  },
  MICROCOPY: {
    key: "MICROCOPY",
    cn: "极短提示",
    en: "Microcopy",
    audience: "移动端 / 卡片 / tooltip / 按钮",
    example: "信号可信 · 还没定 · 建议观察",
  },
};

// 不同用户类型默认语言层级
export const USER_TYPE_DEFAULT_LEVEL: Record<string, UserLanguageLevel[]> = {
  demo_visitor:    ["USER_FRIENDLY", "MICROCOPY"],
  light_user:      ["USER_FRIENDLY", "PROFESSIONAL"],
  full_subject:    ["EDUCATIONAL", "PROFESSIONAL"],
  creator_user:    ["ACTION_ORIENTED", "USER_FRIENDLY"],
  research_user:   ["RAW_SYSTEM", "EDUCATIONAL"],
  enterprise_user: ["ENTERPRISE_SAFE", "PROFESSIONAL"],
  admin_user:      ["RAW_SYSTEM", "PROFESSIONAL"],
  founder_user:    ["RAW_SYSTEM", "EDUCATIONAL"],
};
