import type { FeasibilityAggregation } from "./creationFeasibilityEngine";
import { resolveFeasibility } from "@/constants/creationFeasibilityLevels";

export interface EvolutionRoadmap {
  potential: string;
  milestones: { stage: string; goal: string }[];
}

export function planEvolution(agg: FeasibilityAggregation): EvolutionRoadmap {
  const level = resolveFeasibility(agg.rawScore);
  const potential = level.id === "SCALABLE_CREATION"
    ? "具备扩展为系列/生态/平台的潜力。"
    : level.id === "HIGHLY_BUILDABLE"
      ? "适合做 MVP 并进入正式版本化迭代。"
      : level.id === "BUILDABLE"
        ? "可开发，但建议先做窄版 MVP。"
        : level.id === "PROTOTYPE_POSSIBLE"
          ? "适合做概念原型并寻求关键证伪。"
          : "建议作为创作素材或概念叙事使用。";
  const milestones = [
    { stage: "T0", goal: "锁定窄版 MVP 范围与关键假设" },
    { stage: "T+2w", goal: "完成最小可演示版本" },
    { stage: "T+6w", goal: "首批 5–20 名真实用户回验" },
    { stage: "T+12w", goal: "决定是否进入扩展或回到概念层" },
  ];
  return { potential, milestones };
}
