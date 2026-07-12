// UX 模式定义
export type UXModeKey =
  | "mystic_reduced"
  | "reflective"
  | "decision_os"
  | "creator_strategy"
  | "localized_chinese"
  | "demo_first"
  | "documentation_first";

export interface UXModeDef {
  key: UXModeKey;
  cn: string;
  en: string;
  desc: string;
  bestFor: string[];
}

export const UX_MODES: Record<UXModeKey, UXModeDef> = {
  mystic_reduced: {
    key: "mystic_reduced", cn: "弱神秘模式", en: "Mystic-Reduced Mode",
    desc: "强调结构、时间、决策、回验。隐藏命运 / 占卜表达。",
    bestFor: ["香港", "新加坡", "美国", "企业"],
  },
  reflective: {
    key: "reflective", cn: "自我觉察模式", en: "Reflective Mode",
    desc: "保留仪式感与陪伴感，强调自我觉察、关系、阶段。",
    bestFor: ["台湾", "日本", "个人成长用户"],
  },
  decision_os: {
    key: "decision_os", cn: "决策系统模式", en: "Decision OS Mode",
    desc: "完全企业化语言：scenario / risk window / action permission / review。",
    bestFor: ["企业", "高校", "专业用户"],
  },
  creator_strategy: {
    key: "creator_strategy", cn: "创作者策略模式", en: "Creator Strategy Mode",
    desc: "聚焦 Prompt Forge、Product Vitality、Launch Window。",
    bestFor: ["Indie Hacker", "创作者", "产品开发者"],
  },
  localized_chinese: {
    key: "localized_chinese", cn: "中文本地化模式", en: "Localized Chinese Mode",
    desc: "区分简体 / 繁体 / 专业表达，弱化绝对预测。",
    bestFor: ["内地", "香港", "台湾"],
  },
  demo_first: {
    key: "demo_first", cn: "先体验后建模", en: "Demo-First Mode",
    desc: "首屏 3 步引导：场景 → 地区 → demo prediction，再建模。",
    bestFor: ["全球线上用户"],
  },
  documentation_first: {
    key: "documentation_first", cn: "先解释方法论", en: "Documentation-First Mode",
    desc: "白皮书、回验协议、版本史前置。强调研究原型属性。",
    bestFor: ["高校", "研究", "专业用户"],
  },
};
