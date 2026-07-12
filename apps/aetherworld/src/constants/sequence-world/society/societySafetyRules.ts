export const SOCIETY_SAFETY_NOTE =
  "世界社会系统用于虚拟世界、创作、游戏和系统建模，不代表现实社会事实，也不预测现实政治、宗教、经济或人际关系必然发生。NPC、阵营、信仰、经济、制度和文明阶段均属于虚构世界结构。系统不会把虚拟世界中的声望、财富、权力或社会身份等同于现实身份。Full60 生成的个人世界社会默认仅本地保存，导出前需确认。";

export const SOCIETY_FORBIDDEN = [
  "将虚拟信仰写成现实招募",
  "将虚拟阵营写成现实政治组织",
  "将虚拟经济写成现实金融",
  "将 NPC 对应现实具体人物",
  "无限生成 NPC",
  "自动公开 Full60 世界社会",
  "将虚构社会标记为现实事实",
];

export const SOCIETY_HARD_LIMITS = {
  maxNpcAgents: 60,
  maxFactions: 12,
  maxInstitutions: 12,
  maxAutonomousEventsPerTick: 2,
  maxSocialEdges: 240,
  maxConflictsActive: 20,
};
