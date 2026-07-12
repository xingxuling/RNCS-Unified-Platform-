// 创造物可行性等级
export interface CreationFeasibilityLevel {
  id: string;
  min: number;
  max: number;
  name: string;
  userFriendlyName: string;
  description: string;
  advice: string;
}

export const CREATION_FEASIBILITY_LEVELS: CreationFeasibilityLevel[] = [
  { id: "PURE_FANTASY", min: 0, max: 20, name: "Pure Fantasy", userFriendlyName: "纯幻想",
    description: "适合创作，不适合现实开发。", advice: "可作为世界观/叙事素材使用。" },
  { id: "CONCEPTUAL_ONLY", min: 21, max: 40, name: "Conceptual Only", userFriendlyName: "概念可讲",
    description: "概念成立，但现实路径弱。", advice: "先写白皮书或叙事，不立即开发。" },
  { id: "PROTOTYPE_POSSIBLE", min: 41, max: 60, name: "Prototype Possible", userFriendlyName: "可做原型",
    description: "可以做原型，但需要缩小范围。", advice: "做窄版 MVP，舍弃 80% 功能。" },
  { id: "BUILDABLE", min: 61, max: 80, name: "Buildable", userFriendlyName: "可开发",
    description: "具备可开发/可设计路径。", advice: "排出 4–8 周里程碑。" },
  { id: "HIGHLY_BUILDABLE", min: 81, max: 95, name: "Highly Buildable", userFriendlyName: "高度可建",
    description: "适合做 MVP 或系统化开发。", advice: "进入正式开发与验证流程。" },
  { id: "SCALABLE_CREATION", min: 96, max: 100, name: "Scalable Creation", userFriendlyName: "可扩展级",
    description: "具备扩展和长期演化潜力。", advice: "进入版本化迭代与生态规划。" },
];

export function resolveFeasibility(score: number): CreationFeasibilityLevel {
  return CREATION_FEASIBILITY_LEVELS.find(l => score >= l.min && score <= l.max) ?? CREATION_FEASIBILITY_LEVELS[0];
}
