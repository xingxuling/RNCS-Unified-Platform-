export type RewardTypeId = "EARN" | "BONUS" | "PENALTY" | "ADJUST";

export interface RewardTypeDef {
  id: RewardTypeId;
  label: string;
  description: string;
}

export const REWARD_TYPES: RewardTypeDef[] = [
  { id: "EARN",    label: "获得",   description: "正常贡献奖励。" },
  { id: "BONUS",   label: "加成",   description: "高质量 / 高回验 / 高复用奖励。" },
  { id: "PENALTY", label: "扣减",   description: "重复 / 垃圾 / 安全降级。" },
  { id: "ADJUST",  label: "调整",   description: "审计或手工修正。" },
];
