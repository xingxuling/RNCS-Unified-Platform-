export type UserLearningLevel = "BEGINNER" | "CREATOR" | "BUILDER" | "ADVANCED" | "FOUNDER";

export interface UserLearningLevelDef {
  id: UserLearningLevel;
  label: string;
  chineseLabel: string;
  description: string;
}

export const USER_LEARNING_LEVELS: UserLearningLevelDef[] = [
  { id: "BEGINNER", label: "Beginner", chineseLabel: "普通新手", description: "不需要懂 MSL/引擎，只需点哪里、输入什么、看什么结果。" },
  { id: "CREATOR", label: "Creator", chineseLabel: "创作者", description: "关注世界、剧情、声乐、角色、设定、图文内容。" },
  { id: "BUILDER", label: "Builder", chineseLabel: "产品 / 开发者", description: "关注 Prompt、模型、代码计划、JSON、Godot / Unity / UI 导出。" },
  { id: "ADVANCED", label: "Advanced", chineseLabel: "高阶用户", description: "关注 MSL、终端、世界模拟、常数宇宙、宪法、QA。" },
  { id: "FOUNDER", label: "Founder", chineseLabel: "Founder", description: "系统治理、常数锁定、宪法修订、全系统审计、版本与导出。" },
];

export function getLearningLevel(id: string): UserLearningLevelDef | undefined {
  return USER_LEARNING_LEVELS.find((l) => l.id === id);
}
