export const WORLD_EXPANSION_TYPES = [
  "ZONE_EXPANSION","NPC_EXPANSION","QUEST_EXPANSION","RESOURCE_EXPANSION",
  "LORE_EXPANSION","SYSTEM_EXPANSION","RELATION_EXPANSION","TIMELINE_EXPANSION",
] as const;
export type WorldExpansionType = typeof WORLD_EXPANSION_TYPES[number];

export const DIGIT_EXPANSION_THEMES: Record<string, { zone: string; flavor: string }> = {
  "0": { zone: "封存归档区", flavor: "归档·虚空·结束" },
  "1": { zone: "主权核心", flavor: "起源·神殿·创始" },
  "2": { zone: "关系港口", flavor: "联结·同盟·社群" },
  "3": { zone: "符号城市", flavor: "文本·传播·象征" },
  "4": { zone: "规则庭", flavor: "制度·边界·审判" },
  "5": { zone: "风暴裂口", flavor: "事件·变化·裂变" },
  "6": { zone: "恢复花园", flavor: "生命·承载·疗愈" },
  "7": { zone: "梦境迷宫", flavor: "潜意识·隐藏·梦" },
  "8": { zone: "资源熔炉", flavor: "矿脉·交易·资产" },
  "9": { zone: "文明遗迹", flavor: "终局·星海·裁决" },
};
