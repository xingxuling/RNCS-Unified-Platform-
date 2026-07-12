// 世界生成模式
export type WorldGenerationModeId =
  | "DEMO_WORLD" | "LIGHT_WORLD" | "FULL_WORLD"
  | "CREATOR_WORLD" | "DECISION_WORLD" | "FOUNDER_WORLD";

export interface WorldGenerationMode {
  id: WorldGenerationModeId;
  name: string;
  en: string;
  description: string;
  subjectModeRequired: "DEMO" | "LIGHT_20" | "FULL_60" | "ANY";
  founderOnly?: boolean;
  privacyNote?: string;
  defaultNarrativeStyle: string;
  recommendedFor: string;
}

export const WORLD_GENERATION_MODES: WorldGenerationMode[] = [
  { id: "DEMO_WORLD", name: "模拟世界", en: "Demo World",
    description: "使用 Demo Persona 生成的体验型世界，适合首次试用。",
    subjectModeRequired: "ANY", defaultNarrativeStyle: "friendly",
    recommendedFor: "首次体验 / 演示", privacyNote: "这是模拟世界，不代表你的真实个人世界。" },
  { id: "LIGHT_WORLD", name: "轻量个人世界", en: "Light World",
    description: "基于 Light 20 主体或简单输入生成的个人世界。",
    subjectModeRequired: "ANY", defaultNarrativeStyle: "friendly",
    recommendedFor: "大多数普通用户" },
  { id: "FULL_WORLD", name: "深度个人世界", en: "Full World",
    description: "基于完整 Full 60 主体数列生成，结构最完整。",
    subjectModeRequired: "FULL_60", defaultNarrativeStyle: "balanced",
    recommendedFor: "高阶用户 / 私密环境",
    privacyNote: "深度个人世界会读取完整主体数列，仅建议在私密环境使用。" },
  { id: "CREATOR_WORLD", name: "创作者世界", en: "Creator World",
    description: "偏向世界观、小说、角色与符号系统的创作型生成。",
    subjectModeRequired: "ANY", defaultNarrativeStyle: "poetic",
    recommendedFor: "创作者 / 世界观设计" },
  { id: "DECISION_WORLD", name: "决策世界", en: "Decision World",
    description: "偏向现实行动、事业、关系、产品与风险的决策型生成。",
    subjectModeRequired: "ANY", defaultNarrativeStyle: "pragmatic",
    recommendedFor: "决策辅助 / 行动地图" },
  { id: "FOUNDER_WORLD", name: "创始人世界", en: "Founder World",
    description: "偏向计算法宇宙、产品系统与创始人控制台的治理视角。",
    subjectModeRequired: "ANY", founderOnly: true, defaultNarrativeStyle: "technical",
    recommendedFor: "Founder Mode · 系统治理" },
];

export const getWorldMode = (id: string): WorldGenerationMode =>
  WORLD_GENERATION_MODES.find(m => m.id === id) ?? WORLD_GENERATION_MODES[0];
