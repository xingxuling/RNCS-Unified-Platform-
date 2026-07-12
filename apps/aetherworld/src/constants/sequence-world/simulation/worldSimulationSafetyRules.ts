export const WORLD_SIM_SAFETY_RULES = [
  { id: "no-reality-claim",        severity: "CRITICAL", message: "禁止将虚拟世界模拟当作现实事实" },
  { id: "no-npc-real-person",      severity: "CRITICAL", message: "禁止将 NPC 对应现实具体人物" },
  { id: "no-event-must-happen",    severity: "HIGH",     message: "禁止声称世界事件必然发生" },
  { id: "no-infinite-tick",        severity: "HIGH",     message: "禁止无限自动 tick" },
  { id: "full60-export-confirm",   severity: "HIGH",     message: "Full60 世界导出前需二次确认" },
  { id: "fiction-not-real-knowledge", severity: "HIGH",  message: "虚构 lore 不可标记为现实知识" },
  { id: "tick-must-have-cap",      severity: "MEDIUM",   message: "tick 必须有上限保护" },
] as const;

export const WORLD_SIM_DISCLAIMERS = [
  "数列世界模拟是虚拟世界、创作、游戏、系统建模与自我理解的模拟工具，不代表现实事实，也不预测现实必然发生。",
  "世界中的 NPC、事件、资源、因果链都是模拟结构，不应替代现实关系判断、医疗、法律、金融、心理诊断或专业工程决策。",
  "Full60 或真实主体相关世界数据默认本地保存，导出前需确认。",
];
