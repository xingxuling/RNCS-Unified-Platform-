// 个人 App Profile schema 与原型
export interface AppArchetypeDef {
  id: string;
  name: string;
  en: string;
  description: string;
  recommendedModules: string[];
}

export const APP_ARCHETYPES: AppArchetypeDef[] = [
  { id: "DECISION_ASSISTANT_APP", name: "个人决策辅助型", en: "Decision Assistant",
    description: "聚焦预测、回验与日常判断。",
    recommendedModules: ["/", "/calendar", "/timeline", "/feedback", "/recalculation"] },
  { id: "CREATOR_STRATEGY_APP", name: "创作者策略型", en: "Creator Strategy",
    description: "聚焦内容、文案与世界生成。",
    recommendedModules: ["/copy-generator", "/world-generator", "/prompt-forge", "/encyclopedia"] },
  { id: "FOUNDER_CONTROL_APP", name: "创始人控制台型", en: "Founder Control",
    description: "聚焦控制台、权限、代码生成。",
    recommendedModules: ["/founder-console", "/code-generator", "/generation-os", "/recalculation"] },
  { id: "COGNITIVE_RECOVERY_APP", name: "认知恢复型", en: "Cognitive Recovery",
    description: "聚焦信号清理与节奏。",
    recommendedModules: ["/signal", "/resonance", "/calendar", "/usage-safety"] },
  { id: "RELATIONSHIP_CLARITY_APP", name: "关系判断型", en: "Relationship Clarity",
    description: "聚焦关系与社交事件。",
    recommendedModules: ["/prediction-dimensions", "/event-algorithms", "/timeline"] },
  { id: "PRODUCT_BUILDER_APP", name: "产品构建型", en: "Product Builder",
    description: "聚焦构建、QA、代码与文档。",
    recommendedModules: ["/prompt-forge", "/code-generator", "/software-qa", "/recalculation", "/encyclopedia"] },
  { id: "WORLD_GENERATOR_APP", name: "虚拟世界生成型", en: "World Generator",
    description: "聚焦个人世界与虚拟世界 OS。",
    recommendedModules: ["/world-generator", "/virtual-world", "/world-map", "/world-quests"] },
  { id: "RESEARCH_CODEX_APP", name: "研究百科型", en: "Research Codex",
    description: "聚焦百科、文档与常数宇宙。",
    recommendedModules: ["/encyclopedia", "/docs", "/constants-universe", "/constants"] },
  { id: "PROMPT_STRATEGY_APP", name: "提示词战略型", en: "Prompt Strategy",
    description: "聚焦 Prompt Forge 与抽象提示词。",
    recommendedModules: ["/prompt-forge", "/abstract-prompt-forge", "/copy-generator"] },
  { id: "MINIMAL_DAILY_APP", name: "极简每日判断型", en: "Minimal Daily",
    description: "聚焦主控台与今日触发。",
    recommendedModules: ["/", "/calendar", "/onboarding"] },
];

export interface PersonalAppProfile {
  profileId: string;
  profileName: string;
  appArchetype: string;
  homeLayout: string;
  preferredLanguageLevel: string;
  preferredUIDensity: string;
  topModules: string[];
  hiddenModules: string[];
  recommendedShortcuts: string[];
  priorityDimensions: string[];
  priorityEventTypes: string[];
  feedbackReminderStyle: string;
  promptForgeMode: string;
  worldGenerationMode: string;
  safetyLevel: string;
  lastEvolvedAt: string;
}

export function getArchetype(id: string) {
  return APP_ARCHETYPES.find(a => a.id === id);
}

export const DEFAULT_APP_PROFILE: PersonalAppProfile = {
  profileId: "default",
  profileName: "默认 App",
  appArchetype: "MINIMAL_DAILY_APP",
  homeLayout: "STANDARD",
  preferredLanguageLevel: "BEGINNER",
  preferredUIDensity: "STANDARD",
  topModules: ["/", "/onboarding", "/calendar"],
  hiddenModules: [],
  recommendedShortcuts: [],
  priorityDimensions: [],
  priorityEventTypes: [],
  feedbackReminderStyle: "GENTLE",
  promptForgeMode: "STANDARD",
  worldGenerationMode: "LIGHT",
  safetyLevel: "STANDARD",
  lastEvolvedAt: new Date(0).toISOString(),
};
