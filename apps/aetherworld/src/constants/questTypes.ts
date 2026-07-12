// 虚拟世界任务类型 Quest Types
export type QuestStage =
  | "SEED" | "FORMING" | "TRIGGERED" | "ESCALATING" | "CONFIRMING"
  | "PEAKING" | "DECLINING" | "BLOCKED" | "REVERSED" | "ARCHIVED";

export interface QuestType {
  id: string;
  name: string;
  enName: string;
  description: string;
  baseDifficulty: number;
  baseUrgency: number;
}

export const QUEST_TYPES: QuestType[] = [
  { id: "MAIN", name: "主线任务", enName: "Main Quest", description: "推动主线发展。", baseDifficulty: 7, baseUrgency: 6 },
  { id: "SIDE", name: "支线任务", enName: "Side Quest", description: "可选的扩展任务。", baseDifficulty: 4, baseUrgency: 3 },
  { id: "DAILY", name: "日常任务", enName: "Daily Quest", description: "日常累积型任务。", baseDifficulty: 2, baseUrgency: 4 },
  { id: "HIDDEN", name: "隐藏任务", enName: "Hidden Quest", description: "条件触发型任务。", baseDifficulty: 6, baseUrgency: 2 },
  { id: "RELATIONSHIP", name: "关系任务", enName: "Relationship Quest", description: "推进人际关系。", baseDifficulty: 5, baseUrgency: 5 },
  { id: "RECOVERY", name: "恢复任务", enName: "Recovery Quest", description: "修复身心系统。", baseDifficulty: 3, baseUrgency: 7 },
  { id: "CREATION", name: "创作任务", enName: "Creation Quest", description: "产出作品。", baseDifficulty: 6, baseUrgency: 4 },
  { id: "PRODUCT", name: "产品任务", enName: "Product Quest", description: "产品迭代与发布。", baseDifficulty: 7, baseUrgency: 5 },
  { id: "RISK", name: "风险任务", enName: "Risk Quest", description: "应对风险事件。", baseDifficulty: 8, baseUrgency: 8 },
  { id: "AWAKENING", name: "觉醒任务", enName: "Awakening Quest", description: "认知觉醒型任务。", baseDifficulty: 7, baseUrgency: 3 },
  { id: "ADMIN", name: "制度任务", enName: "Admin Quest", description: "走流程、办手续。", baseDifficulty: 5, baseUrgency: 6 },
  { id: "FOUNDER", name: "创始人任务", enName: "Founder Quest", description: "系统治理与版本决策。", baseDifficulty: 9, baseUrgency: 7 },
];

export const STAGE_LABEL: Record<QuestStage, string> = {
  SEED: "任务种子", FORMING: "任务成形", TRIGGERED: "任务触发",
  ESCALATING: "任务升级", CONFIRMING: "任务确认", PEAKING: "任务高峰",
  DECLINING: "任务回落", BLOCKED: "任务阻断", REVERSED: "任务反转", ARCHIVED: "任务归档",
};
