// DatasetWeightCalculus · 数据权重计算法
import type { DatasetWeightResult, SampleSourceType } from "./trainingFactoryTypes";

interface WeightInput {
  sourceType: SampleSourceType;
  importance: number; // 0~10
  verifiedScore: number; // 0~10
  reuseCount: number; // 次
  modelImprovementEvidence: number; // 0~10
  safetyStatus: "PASS" | "WARN" | "BLOCK";
  freshness: number; // 0~10
  uniqueness: number; // 0~10
  alignmentWithAetherSeedGoal: number; // 0~10
}

export function computeDatasetWeight(input: WeightInput): DatasetWeightResult {
  if (input.safetyStatus === "BLOCK") {
    return {
      sampleSource: input.sourceType,
      importance: input.importance,
      verifiedScore: input.verifiedScore,
      reuseCount: input.reuseCount,
      modelImprovementEvidence: input.modelImprovementEvidence,
      safetyStatus: input.safetyStatus,
      freshness: input.freshness,
      uniqueness: input.uniqueness,
      alignmentWithAetherSeedGoal: input.alignmentWithAetherSeedGoal,
      datasetWeight: 0,
    };
  }
  const safetyPenalty = input.safetyStatus === "WARN" ? 0.7 : 1;
  const reuseScore = Math.min(10, Math.log2(input.reuseCount + 2) * 3);
  const raw =
    input.importance * 0.18 +
    input.verifiedScore * 0.16 +
    reuseScore * 0.1 +
    input.modelImprovementEvidence * 0.18 +
    input.freshness * 0.08 +
    input.uniqueness * 0.12 +
    input.alignmentWithAetherSeedGoal * 0.18;
  const weight = Math.max(0, Math.min(1, (raw / 10) * safetyPenalty));
  return {
    sampleSource: input.sourceType,
    importance: input.importance,
    verifiedScore: input.verifiedScore,
    reuseCount: input.reuseCount,
    modelImprovementEvidence: input.modelImprovementEvidence,
    safetyStatus: input.safetyStatus,
    freshness: input.freshness,
    uniqueness: input.uniqueness,
    alignmentWithAetherSeedGoal: input.alignmentWithAetherSeedGoal,
    datasetWeight: Number(weight.toFixed(3)),
  };
}

export function buildDefaultWeightSamples(): DatasetWeightResult[] {
  return [
    computeDatasetWeight({
      sourceType: "CHAT_COMPRESSION",
      importance: 9, verifiedScore: 7, reuseCount: 12, modelImprovementEvidence: 8,
      safetyStatus: "PASS", freshness: 9, uniqueness: 8, alignmentWithAetherSeedGoal: 9,
    }),
    computeDatasetWeight({
      sourceType: "MSL",
      importance: 8, verifiedScore: 8, reuseCount: 6, modelImprovementEvidence: 7,
      safetyStatus: "PASS", freshness: 8, uniqueness: 9, alignmentWithAetherSeedGoal: 10,
    }),
    computeDatasetWeight({
      sourceType: "SEQUENCE_MEMORY",
      importance: 9, verifiedScore: 7, reuseCount: 8, modelImprovementEvidence: 7,
      safetyStatus: "PASS", freshness: 8, uniqueness: 8, alignmentWithAetherSeedGoal: 9,
    }),
    computeDatasetWeight({
      sourceType: "LOVABLE_PROMPT",
      importance: 7, verifiedScore: 6, reuseCount: 4, modelImprovementEvidence: 6,
      safetyStatus: "WARN", freshness: 7, uniqueness: 6, alignmentWithAetherSeedGoal: 7,
    }),
    computeDatasetWeight({
      sourceType: "NETWORK_CORPUS",
      importance: 6, verifiedScore: 5, reuseCount: 2, modelImprovementEvidence: 4,
      safetyStatus: "WARN", freshness: 9, uniqueness: 7, alignmentWithAetherSeedGoal: 5,
    }),
    computeDatasetWeight({
      sourceType: "BUG_AUDIT",
      importance: 7, verifiedScore: 8, reuseCount: 5, modelImprovementEvidence: 6,
      safetyStatus: "PASS", freshness: 8, uniqueness: 8, alignmentWithAetherSeedGoal: 8,
    }),
    computeDatasetWeight({
      sourceType: "OPEN_ARCHITECTURE",
      importance: 5, verifiedScore: 4, reuseCount: 1, modelImprovementEvidence: 3,
      safetyStatus: "WARN", freshness: 7, uniqueness: 6, alignmentWithAetherSeedGoal: 5,
    }),
  ];
}
