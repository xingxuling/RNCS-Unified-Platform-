// 虚拟世界模式 Virtual World Modes
export type VirtualWorldModeId =
  | "DEMO_WORLD" | "LIGHT_PERSONAL_WORLD" | "FULL_PERSONAL_WORLD"
  | "CREATOR_WORLD" | "DECISION_WORLD" | "GAME_SEED_WORLD" | "FOUNDER_WORLD";

export interface VirtualWorldMode {
  id: VirtualWorldModeId;
  name: string;
  enName: string;
  description: string;
  audience: "beginner" | "advanced" | "founder";
  privacyLevel: "low" | "medium" | "high";
  requiresFounder?: boolean;
  recommendedSubjectMode: "DEMO" | "LIGHT_20" | "FULL_60" | "IMPORTED";
  bias: string[];
  safetyHint: string;
}

export const VIRTUAL_WORLD_MODES: VirtualWorldMode[] = [
  { id: "DEMO_WORLD", name: "模拟世界", enName: "Demo World",
    description: "用 Demo Persona 生成的体验世界，适合第一次接触。",
    audience: "beginner", privacyLevel: "low", recommendedSubjectMode: "DEMO",
    bias: ["可视化", "无隐私风险", "示范用途"],
    safetyHint: "这是模拟世界，不代表你的真实个人世界。" },
  { id: "LIGHT_PERSONAL_WORLD", name: "轻量个人世界", enName: "Light Personal World",
    description: "基于 Light 20 主体生成的轻量虚拟世界。",
    audience: "beginner", privacyLevel: "medium", recommendedSubjectMode: "LIGHT_20",
    bias: ["核心结构", "简化叙事", "日常决策"],
    safetyHint: "轻量世界足够用于日常自我理解。" },
  { id: "FULL_PERSONAL_WORLD", name: "深度个人世界", enName: "Full Personal World",
    description: "基于 Full 60 完整主体的深度虚拟世界。",
    audience: "advanced", privacyLevel: "high", recommendedSubjectMode: "FULL_60",
    bias: ["完整结构", "深层因果", "长期演化"],
    safetyHint: "深度世界会读取 Full 60 完整主体数列，请只在私密环境中使用。" },
  { id: "CREATOR_WORLD", name: "创作者世界", enName: "Creator World",
    description: "偏向小说、角色、世界观创作的世界。",
    audience: "advanced", privacyLevel: "medium", recommendedSubjectMode: "LIGHT_20",
    bias: ["叙事", "角色", "世界观"],
    safetyHint: "用于创作灵感，非真实命运预言。" },
  { id: "DECISION_WORLD", name: "决策世界", enName: "Decision World",
    description: "偏向事业、关系、产品、风险等现实决策。",
    audience: "advanced", privacyLevel: "medium", recommendedSubjectMode: "LIGHT_20",
    bias: ["事业", "关系", "风险", "行动"],
    safetyHint: "用于辅助决策，不替代专业判断。" },
  { id: "GAME_SEED_WORLD", name: "游戏种子世界", enName: "Game Seed World",
    description: "偏向地图、任务、NPC、成长系统的游戏化世界。",
    audience: "advanced", privacyLevel: "medium", recommendedSubjectMode: "LIGHT_20",
    bias: ["地图", "任务", "成长"],
    safetyHint: "游戏化呈现，非现实承诺。" },
  { id: "FOUNDER_WORLD", name: "创始人世界", enName: "Founder World",
    description: "偏向计算法宇宙、产品系统与 GM 后台。",
    audience: "founder", privacyLevel: "high", requiresFounder: true,
    recommendedSubjectMode: "FULL_60",
    bias: ["系统", "规则", "治理"],
    safetyHint: "仅在创始人模式下可见，含完整结构数据。" },
];

export function getVirtualWorldMode(id: string): VirtualWorldMode | undefined {
  return VIRTUAL_WORLD_MODES.find(m => m.id === id);
}
