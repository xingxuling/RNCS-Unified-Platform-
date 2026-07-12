import type { UserLearningLevel } from "./userLearningLevels";

export interface TutorialPathTemplate {
  pathId: string;
  title: string;
  chineseTitle: string;
  level: UserLearningLevel;
  estimatedMinutes: number;
  tutorialIds: string[];
  description: string;
}

export const TUTORIAL_PATH_TEMPLATES: TutorialPathTemplate[] = [
  {
    pathId: "path_beginner_10",
    title: "Beginner: 10-minute onboarding",
    chineseTitle: "普通用户 10 分钟上手",
    level: "BEGINNER",
    estimatedMinutes: 10,
    tutorialIds: ["quick_start_10min", "input_light20_full60", "currency_not_real"],
    description: "进入学习中心 → 主体模式 → 随便问 → Sequence AI → 保存。",
  },
  {
    pathId: "path_creator_30",
    title: "Creator: 30-minute path",
    chineseTitle: "创作者 30 分钟路径",
    level: "CREATOR",
    estimatedMinutes: 30,
    tutorialIds: ["world_generate_55555"],
    description: "生成世界 → NPC → 剧情 → 声乐 → 翻译 → 导出创作包。",
  },
  {
    pathId: "path_builder_45",
    title: "Builder: 45-minute path",
    chineseTitle: "开发者 45 分钟路径",
    level: "BUILDER",
    estimatedMinutes: 45,
    tutorialIds: ["msl_terminal_usage"],
    description: "Free Input → 模型 → Prompt → 导出 JSON → QA → 修复 UI 缺口。",
  },
  {
    pathId: "path_world_60",
    title: "World Engine: 60-minute path",
    chineseTitle: "世界引擎 60 分钟路径",
    level: "CREATOR",
    estimatedMinutes: 60,
    tutorialIds: ["world_generate_55555"],
    description: "World Gen → Simulation → Growth → Society → Civilization → Presentation → Godot/Unity 导出。",
  },
  {
    pathId: "path_founder",
    title: "Founder: System governance path",
    chineseTitle: "Founder 系统治理路径",
    level: "FOUNDER",
    estimatedMinutes: 30,
    tutorialIds: ["founder_governance"],
    description: "宪法 → 常数宇宙 → 界面审计 → Software QA → Recalculation → Founder Trace → 系统报告。",
  },
];
