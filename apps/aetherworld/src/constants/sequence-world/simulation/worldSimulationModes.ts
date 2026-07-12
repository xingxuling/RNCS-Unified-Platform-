export const WORLD_SIMULATION_MODES = [
  { id: "DEMO", label: "Demo 模拟", description: "最小示例，使用样例数列" },
  { id: "PERSONAL_WORLD", label: "个人世界", description: "基于 Light20 / Full60 主体数列" },
  { id: "CREATOR_WORLD", label: "创作世界", description: "用于剧情、漫画、游戏世界观" },
  { id: "GAME_WORLD", label: "游戏世界", description: "用于 Godot/Unity 运行时" },
  { id: "FOUNDER_SIMULATION", label: "Founder 模拟", description: "高级调度，可查看完整 trace" },
] as const;

export type WorldSimulationModeId = typeof WORLD_SIMULATION_MODES[number]["id"];

export const MAX_TICKS_PER_RUN: Record<WorldSimulationModeId, number> = {
  DEMO: 5,
  PERSONAL_WORLD: 20,
  CREATOR_WORLD: 40,
  GAME_WORLD: 60,
  FOUNDER_SIMULATION: 200,
};
