export interface VirtualLifeActivity {
  id: string;
  userFriendlyName: string;
  questType: string;
  virtualDescription: string;
  realWorldAction: string;
  energyCost: number;
}

export const VIRTUAL_LIFE_ACTIVITIES: VirtualLifeActivity[] = [
  { id: "MORNING_WATER",   userFriendlyName: "晨光取水",     questType: "RECOVERY_TASK",     virtualDescription: "前往中庭的清晨水台。",            realWorldAction: "起床喝一杯水。",                   energyCost: 1 },
  { id: "WORKSHOP_PUSH",   userFriendlyName: "工坊推进",     questType: "PRODUCT_BUILD",     virtualDescription: "回到产品工坊，修复一处入口。",    realWorldAction: "完成一个最小开发改动。",           energyCost: 4 },
  { id: "SCRIPT_LANTERN",  userFriendlyName: "点亮文案灯",   questType: "CREATIVE_OUTPUT",   virtualDescription: "在写作塔点亮一盏文字灯。",        realWorldAction: "写一段 300 字以内的内容。",        energyCost: 3 },
  { id: "ARCHIVE_HALL",    userFriendlyName: "归档大厅",     questType: "ARCHIVE_TASK",      virtualDescription: "把今天的世界事件存入大厅卷轴。",  realWorldAction: "整理一条百科或一个文档。",         energyCost: 2 },
  { id: "BRIDGE_TALK",     userFriendlyName: "桥头对话",     questType: "SOCIAL_SIGNAL",     virtualDescription: "在桥头与一名 NPC 交换信号。",     realWorldAction: "给一个真实联系人发一条短信息。",   energyCost: 2 },
  { id: "ANCHOR_STONE",    userFriendlyName: "锚石校准",     questType: "DAILY_ANCHOR",      virtualDescription: "把一颗锚石放回世界中心。",        realWorldAction: "完成一件具体小事并标记完成。",     energyCost: 1 },
  { id: "FEEDBACK_WELL",   userFriendlyName: "回验之井",     questType: "FEEDBACK_TASK",     virtualDescription: "在井边查看昨日预测的回声。",      realWorldAction: "记录一条「命中/未命中」反馈。",    energyCost: 1 },
  { id: "QUIET_GROVE",     userFriendlyName: "静林散步",     questType: "RECOVERY_TASK",     virtualDescription: "穿过城外的静林。",                realWorldAction: "20 分钟离屏散步或拉伸。",          energyCost: 2 },
  { id: "RISK_LATCH",      userFriendlyName: "风险闸门",     questType: "RISK_REDUCTION",    virtualDescription: "关闭一条多余的支线门。",          realWorldAction: "今天主动停掉一个想再扩的功能。",   energyCost: 1 },
  { id: "FOUNDER_HALL",    userFriendlyName: "创始人厅",     questType: "FOUNDER_TASK",      virtualDescription: "进入控制台核心层。",              realWorldAction: "处理一个权限/QA/版本任务。",       energyCost: 3 },
];
