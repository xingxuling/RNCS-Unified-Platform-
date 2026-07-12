export interface VirtualLifeState {
  id: string;
  userFriendlyName: string;
  description: string;
  recommendedActions: string[];
  risk: string;
  realityAnchor: string;
}

export const VIRTUAL_LIFE_STATES: VirtualLifeState[] = [
  { id: "AWAKENING",     userFriendlyName: "醒来",   description: "新的一天开始。", recommendedActions: ["查看今日世界状态", "设定一个最小现实任务"], risk: "刚醒时易做空想计划", realityAnchor: "起床喝水，写下今天唯一一件事。" },
  { id: "EXPLORING",     userFriendlyName: "探索",   description: "接触新区域、新NPC、新任务。", recommendedActions: ["走访新区域", "认识一个NPC"], risk: "易扩张过多", realityAnchor: "只探索一个新点。" },
  { id: "BUILDING",      userFriendlyName: "建设",   description: "推进作品、产品或系统。", recommendedActions: ["推进一个模块", "写一段内容"], risk: "易过度堆功能", realityAnchor: "今天只做一个最小改动。" },
  { id: "TRAINING",      userFriendlyName: "训练",   description: "学习、运动、恢复、提升。", recommendedActions: ["20分钟运动", "读一段内容"], risk: "易跳过休息", realityAnchor: "训练后强制休息。" },
  { id: "SOCIALIZING",   userFriendlyName: "社交",   description: "关系互动与映射。", recommendedActions: ["发一条信息", "观察一次回应"], risk: "易把NPC当成真人", realityAnchor: "区分虚拟NPC与现实人物。" },
  { id: "RESTING",       userFriendlyName: "休息",   description: "恢复与低负载。", recommendedActions: ["小睡", "断开屏幕"], risk: "易刷手机继续高负载", realityAnchor: "10分钟不看屏幕。" },
  { id: "CONFLICT",      userFriendlyName: "冲突",   description: "阻力、误解、噪声。", recommendedActions: ["暂停一次", "写下冲突点"], risk: "易冲动反应", realityAnchor: "至少等15分钟再回应。" },
  { id: "REFLECTING",    userFriendlyName: "反思",   description: "写日记、整理信号。", recommendedActions: ["写3行日记", "标注一次回验"], risk: "易陷入自责", realityAnchor: "只写事实，不评判。" },
  { id: "ARCHIVING",     userFriendlyName: "归档",   description: "保存世界记忆。", recommendedActions: ["整理一条百科", "归档今日事件"], risk: "易拖延", realityAnchor: "归档限时5分钟。" },
  { id: "TRANSITIONING", userFriendlyName: "转场",   description: "切换区域、阶段、任务线。", recommendedActions: ["完成一个收尾", "明确下一个起点"], risk: "易半途切换", realityAnchor: "先完成上一件再切换。" },
];

export function getLifeState(id: string): VirtualLifeState | undefined {
  return VIRTUAL_LIFE_STATES.find(s => s.id === id);
}
