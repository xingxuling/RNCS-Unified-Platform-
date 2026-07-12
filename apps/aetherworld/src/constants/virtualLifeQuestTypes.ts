export interface VirtualLifeQuestType {
  id: string;
  userFriendlyName: string;
  description: string;
  baseDifficulty: number;
  founderOnly?: boolean;
}

export const VIRTUAL_LIFE_QUEST_TYPES: VirtualLifeQuestType[] = [
  { id: "DAILY_ANCHOR",      userFriendlyName: "每日锚点",   description: "现实中必须完成的小动作。",            baseDifficulty: 1 },
  { id: "WORLD_EXPLORATION", userFriendlyName: "世界探索",   description: "看新区域、新设定、新角色。",          baseDifficulty: 2 },
  { id: "PRODUCT_BUILD",     userFriendlyName: "产品建设",   description: "推进一个产品模块。",                  baseDifficulty: 3 },
  { id: "CREATIVE_OUTPUT",   userFriendlyName: "创作输出",   description: "写歌、写文、做图、写设定。",          baseDifficulty: 3 },
  { id: "RECOVERY_TASK",     userFriendlyName: "恢复任务",   description: "运动、睡眠、饮食、休息。",            baseDifficulty: 1 },
  { id: "SOCIAL_SIGNAL",     userFriendlyName: "关系信号",   description: "观察、沟通、等待、记录互动。",        baseDifficulty: 2 },
  { id: "FEEDBACK_TASK",     userFriendlyName: "回验任务",   description: "记录结果，判断是否命中。",            baseDifficulty: 1 },
  { id: "ARCHIVE_TASK",      userFriendlyName: "归档任务",   description: "整理文档、百科、常数。",              baseDifficulty: 2 },
  { id: "FOUNDER_TASK",      userFriendlyName: "创始人任务", description: "权限、QA、版本、重算。",              baseDifficulty: 3, founderOnly: true },
  { id: "RISK_REDUCTION",    userFriendlyName: "风险降低",   description: "降噪、停扩、暂停、止损。",            baseDifficulty: 1 },
];

export function getQuestType(id: string): VirtualLifeQuestType | undefined {
  return VIRTUAL_LIFE_QUEST_TYPES.find(q => q.id === id);
}
