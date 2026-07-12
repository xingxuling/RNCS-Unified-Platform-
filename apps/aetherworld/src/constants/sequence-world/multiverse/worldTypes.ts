export const WORLD_TYPES = [
  { id: "PERSONAL_WORLD", label: "个人世界", description: "用户私有的个人世界。" },
  { id: "CREATOR_WORLD", label: "创作者世界", description: "创作者构建的虚拟世界。" },
  { id: "GAME_WORLD", label: "游戏世界", description: "游戏化运行的虚拟世界。" },
  { id: "NARRATIVE_WORLD", label: "剧情世界", description: "叙事驱动的世界。" },
  { id: "DEMO_WORLD", label: "演示世界", description: "用于演示的公共世界。" },
  { id: "FOUNDER_WORLD", label: "创始人世界", description: "仅 Founder 可访问的世界。" },
  { id: "ARCHIVE_WORLD", label: "归档世界", description: "已封存的归档世界。" },
  { id: "BRANCH_WORLD", label: "分支世界", description: "从其他世界分支出的世界。" },
  { id: "MIRROR_WORLD", label: "镜像世界", description: "对原世界的镜像复制。" },
  { id: "EXPERIMENTAL_WORLD", label: "实验世界", description: "实验性世界。" },
] as const;
export type WorldTypeId = (typeof WORLD_TYPES)[number]["id"];
