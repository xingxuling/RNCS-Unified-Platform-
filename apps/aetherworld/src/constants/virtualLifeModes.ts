// 虚拟生活模式
export interface VirtualLifeMode {
  id: string;
  userFriendlyName: string;
  description: string;
  requiresFullSubject?: boolean;
  founderOnly?: boolean;
  questBias: string[]; // preferred VirtualLifeQuestType ids
}

export const VIRTUAL_LIFE_MODES: VirtualLifeMode[] = [
  { id: "DEMO_LIFE",            userFriendlyName: "Demo 虚拟生活",   description: "使用 Demo Persona 试一次。", questBias: ["DAILY_ANCHOR", "WORLD_EXPLORATION"] },
  { id: "LIGHT_PERSONAL_LIFE",  userFriendlyName: "轻量个人生活",    description: "基于 Light 20 或简单输入。", questBias: ["DAILY_ANCHOR", "RECOVERY_TASK", "FEEDBACK_TASK"] },
  { id: "FULL_PERSONAL_LIFE",   userFriendlyName: "深度个人生活",    description: "基于 Full 60，必须有隐私提示。", requiresFullSubject: true, questBias: ["DAILY_ANCHOR", "FEEDBACK_TASK", "ARCHIVE_TASK", "RECOVERY_TASK"] },
  { id: "CREATOR_LIFE",         userFriendlyName: "创作者生活",      description: "偏向创作、角色、世界观。", questBias: ["CREATIVE_OUTPUT", "WORLD_EXPLORATION", "ARCHIVE_TASK"] },
  { id: "RECOVERY_LIFE",        userFriendlyName: "恢复型生活",      description: "偏向睡眠、运动、低压任务。", questBias: ["RECOVERY_TASK", "DAILY_ANCHOR", "RISK_REDUCTION"] },
  { id: "PRODUCT_BUILDER_LIFE", userFriendlyName: "产品建设生活",    description: "推进产品、任务、反馈。", questBias: ["PRODUCT_BUILD", "FEEDBACK_TASK", "ARCHIVE_TASK"] },
  { id: "RELATIONSHIP_LIFE",    userFriendlyName: "关系观察生活",    description: "观察关系信号与互动。", questBias: ["SOCIAL_SIGNAL", "FEEDBACK_TASK", "DAILY_ANCHOR"] },
  { id: "FOUNDER_LIFE",         userFriendlyName: "Founder 虚拟生活", description: "世界管理、QA、版本、重算。", founderOnly: true, questBias: ["FOUNDER_TASK", "ARCHIVE_TASK", "PRODUCT_BUILD"] },
];

export function getLifeMode(id: string): VirtualLifeMode | undefined {
  return VIRTUAL_LIFE_MODES.find(m => m.id === id);
}
