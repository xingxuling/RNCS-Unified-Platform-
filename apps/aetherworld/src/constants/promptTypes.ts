export type PromptTypeKey =
  | "foundation" | "expansion" | "ui_upgrade" | "refactor" | "debug"
  | "strategy" | "data_model" | "mvp_to_system" | "localization" | "release";

export interface PromptType {
  key: PromptTypeKey;
  name: string;
  en: string;
  desc: string;
}

export const PROMPT_TYPES: PromptType[] = [
  { key: "foundation",     name: "底层架构提示词",  en: "Foundation Prompt",       desc: "建立基础数据结构、模块、路由。" },
  { key: "expansion",      name: "扩展功能提示词",  en: "Expansion Prompt",        desc: "在现有架构上加入新能力。" },
  { key: "ui_upgrade",     name: "UI 体验升级",     en: "UI Upgrade Prompt",       desc: "优化交互/视觉/信息密度。" },
  { key: "refactor",       name: "重构提示词",      en: "Refactor Prompt",         desc: "保留行为、改善结构与命名。" },
  { key: "debug",          name: "修复提示词",      en: "Debug Prompt",            desc: "定位并修复指定问题。" },
  { key: "strategy",       name: "产品策略提示词",  en: "Product Strategy Prompt", desc: "对方向、定位、路径给出方案。" },
  { key: "data_model",     name: "数据结构提示词",  en: "Data Model Prompt",       desc: "建模、迁移、字段、关系设计。" },
  { key: "mvp_to_system",  name: "MVP→系统提示词",  en: "MVP-to-System Prompt",    desc: "把原型升级为可持续系统。" },
  { key: "localization",   name: "地区化提示词",    en: "Localization Prompt",     desc: "适配特定市场/语言/制度。" },
  { key: "release",        name: "发布准备提示词",  en: "Release Readiness Prompt",desc: "上线前的质量与边界检查。" },
];

export const PROMPT_TARGETS = ["Lovable", "Codex", "Cursor", "Claude", "GPT", "Other"] as const;
export type PromptTarget = (typeof PROMPT_TARGETS)[number];

export const PROMPT_STAGES = ["Idea", "Architecture", "Prototype", "Internal Test", "Release Candidate"] as const;
export type PromptStage = (typeof PROMPT_STAGES)[number];
