export const WORLD_TICK_TYPES = [
  { id: "NORMAL",        label: "常规",     description: "默认推进一步" },
  { id: "EVENT",         label: "事件",     description: "优先推进事件队列" },
  { id: "NPC",           label: "NPC",      description: "优先推进 NPC 行为/记忆" },
  { id: "RESOURCE",      label: "资源",     description: "推进资源流动" },
  { id: "CAUSAL",        label: "因果",     description: "推进因果链结算" },
  { id: "USER_FEEDBACK", label: "用户反馈", description: "用户输入主导下一步" },
] as const;

export type WorldTickType = typeof WORLD_TICK_TYPES[number]["id"];
