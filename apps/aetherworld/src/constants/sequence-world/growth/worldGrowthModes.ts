export const WORLD_GROWTH_MODES = [
  { id: "SAFE", label: "安全生长", desc: "小步扩张，强校验" },
  { id: "CREATIVE", label: "创造生长", desc: "更多变异与新设定" },
  { id: "CANONICAL", label: "正典生长", desc: "新增内容写入软正典" },
  { id: "AUTO_REPAIR", label: "自动修复", desc: "聚焦矛盾合并与压缩" },
  { id: "FOUNDER", label: "创始人模式", desc: "全权限，写入硬正典/可锁定" },
] as const;
export type WorldGrowthMode = typeof WORLD_GROWTH_MODES[number]["id"];
