// 因果链类型 Causality Types
export interface CausalityType {
  id: string;
  name: string;
  description: string;
}

export const CAUSALITY_TYPES: CausalityType[] = [
  { id: "ACTION_TO_ZONE", name: "行动→区域", description: "行动改变了某个地图区域状态。" },
  { id: "ACTION_TO_QUEST", name: "行动→任务", description: "行动推进或阻断了任务阶段。" },
  { id: "ACTION_TO_NPC", name: "行动→NPC", description: "行动改变了某个 NPC 关系。" },
  { id: "FEEDBACK_TO_LAW", name: "回验→法则", description: "回验数据调整了世界法则权重。" },
  { id: "CONSTANT_TO_LAW", name: "常数→法则", description: "常数宇宙更新影响了世界法则。" },
  { id: "EVENT_TO_QUEST", name: "事件→任务", description: "事件宇宙变化触发新任务。" },
];
