// 六大模板族类型 · Template Family Types
export type TemplateFamilyType =
  | "FOUNDATION"
  | "EXPANSION"
  | "DEBUG_REPAIR"
  | "UX_USER_FACING"
  | "STRATEGY"
  | "VALIDATION_FEEDBACK";

export interface TemplateFamilyMeta {
  key: TemplateFamilyType;
  cn: string;
  en: string;
  desc: string;
  intent: string;
}

export const TEMPLATE_FAMILY_META: Record<TemplateFamilyType, TemplateFamilyMeta> = {
  FOUNDATION:           { key: "FOUNDATION",           cn: "底层架构",   en: "Foundation",            desc: "从零搭建系统 / 框架 / 文档。", intent: "建立可演进的最小骨架。" },
  EXPANSION:            { key: "EXPANSION",            cn: "扩展增强",   en: "Expansion",             desc: "在现有基础上新增模块 / 章节 / 子系统。", intent: "在不破坏底盘的前提下增量交付。" },
  DEBUG_REPAIR:         { key: "DEBUG_REPAIR",         cn: "修复修补",   en: "Debug / Repair",        desc: "修 bug、补缺口、处理错位、状态漂移。", intent: "定位问题并最小化修复。" },
  UX_USER_FACING:       { key: "UX_USER_FACING",       cn: "用户体验",   en: "UX / User-Facing",      desc: "优化界面、文案、路径、可理解性。", intent: "提升可读、可用、可信。" },
  STRATEGY:             { key: "STRATEGY",             cn: "战略判断",   en: "Strategy",              desc: "定位、市场、资源、路径、路线图判断。", intent: "在不确定下给出收敛方向。" },
  VALIDATION_FEEDBACK:  { key: "VALIDATION_FEEDBACK",  cn: "验证回验",   en: "Validation / Feedback", desc: "测试、回验、效果评估、权重修正。", intent: "用结果反推模板权重。" },
};

export const TEMPLATE_FAMILY_LIST: TemplateFamilyType[] = [
  "FOUNDATION","EXPANSION","DEBUG_REPAIR","UX_USER_FACING","STRATEGY","VALIDATION_FEEDBACK",
];
