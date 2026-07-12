// 常数宇宙 v1.0 · 统一常数中心引擎
import { NUMBER_CONSTANTS } from "@/constants/numberConstants";
import { FIVE_DOMAIN_CONSTANTS } from "@/constants/fiveDomainConstants";
import { MULTIPLY_OPERATORS, DIVIDE_OPERATORS } from "@/constants/operatorConstants";
import { TIME_PHASE_CONSTANTS } from "@/constants/timePhaseConstants";
import { EVENT_DIMENSION_CONSTANTS, EVENT_GLOBAL_CONSTANTS } from "@/constants/eventConstants";
import { FEEDBACK_OUTCOME_WEIGHTS, FEEDBACK_TIMING_WEIGHTS, FEEDBACK_BIAS_FLAGS } from "@/constants/feedbackConstants";
import { USER_CONSTANTS } from "@/constants/userConstants";
import { PLATFORM_CONSTANTS } from "@/constants/platformConstants";
import { PHYSICAL_REALITY_CONSTANTS } from "@/constants/physicalRealityConstants";
import { CONSTANT_GROUPS } from "@/constants/constantGroups";

export const CONSTANT_UNIVERSE_VERSION = "Constant Universe v1.0";

export const ConstantUniverse = {
  version: CONSTANT_UNIVERSE_VERSION,
  numbers: NUMBER_CONSTANTS,
  domains: FIVE_DOMAIN_CONSTANTS,
  multiplyOperators: MULTIPLY_OPERATORS,
  divideOperators: DIVIDE_OPERATORS,
  timePhases: TIME_PHASE_CONSTANTS,
  eventGlobals: EVENT_GLOBAL_CONSTANTS,
  eventDimensions: EVENT_DIMENSION_CONSTANTS,
  feedbackOutcomes: FEEDBACK_OUTCOME_WEIGHTS,
  feedbackTiming: FEEDBACK_TIMING_WEIGHTS,
  feedbackBias: FEEDBACK_BIAS_FLAGS,
  users: USER_CONSTANTS,
  platforms: PLATFORM_CONSTANTS,
  physical: PHYSICAL_REALITY_CONSTANTS,
  groups: CONSTANT_GROUPS,
};

export type ConstantUniverseType = typeof ConstantUniverse;

export interface UniverseHealth {
  score: number; // 0-100
  totalConstants: number;
  groups: number;
  drift: number;
  duplicates: number;
  missing: number;
  unversionedChanges: number;
  notes: string[];
}

export function computeUniverseHealth(): UniverseHealth {
  // 简化健康度：基于完整度 - 漂移 - 缺失
  const totalConstants =
    ConstantUniverse.numbers.length +
    ConstantUniverse.domains.length +
    ConstantUniverse.multiplyOperators.length +
    ConstantUniverse.divideOperators.length +
    ConstantUniverse.timePhases.length +
    ConstantUniverse.eventDimensions.length +
    ConstantUniverse.feedbackOutcomes.length +
    ConstantUniverse.users.length +
    ConstantUniverse.platforms.length +
    ConstantUniverse.physical.length;

  const missing = ConstantUniverse.physical.filter(p => p.status === "PLACEHOLDER").length;
  const drift = 0;        // 当前无运行时漂移
  const duplicates = 0;
  const unversionedChanges = 0;

  const completeness = Math.min(100, Math.round((totalConstants / 220) * 100));
  const penalty = drift * 8 + duplicates * 12 + missing * 1.2 + unversionedChanges * 6;
  const score = Math.max(0, Math.min(100, completeness - penalty));

  return {
    score,
    totalConstants,
    groups: ConstantUniverse.groups.length,
    drift, duplicates, missing, unversionedChanges,
    notes: [
      "已建立 9 大常数分组的统一来源。",
      "物理现实常数大部分仍为 Phase C 占位接口。",
      "回验、事件、平台常数已可供主要计算法读取。",
    ],
  };
}
