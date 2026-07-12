// TrainingCostCalculus · 成本计算法
// Cost = GPU/电费 + 注意力切换 + 数据污染风险 + 失败重训 - 自动化复用 - 血统积累 - 本机慢跑收益
import type { ForgeLocation, TrainingCostResult } from "./trainingFactoryTypes";

export interface CostInput {
  experimentId: string;
  parameterScaleM: number; // 单位 M
  expectedHours: number;
  forgeLocation: Exclude<ForgeLocation, "HYBRID">;
  reusable: boolean;
  bloodlineCritical: boolean;
}

export function estimateTrainingCost(input: CostInput): TrainingCostResult {
  const isLocal = input.forgeLocation === "LOCAL_PC";
  const moneyCost = isLocal
    ? Math.round(input.expectedHours * 0.5) // 电费估算（元）
    : Math.round(input.parameterScaleM * 0.6 + input.expectedHours * 8);
  const timeCost = input.expectedHours;
  const attentionCost = isLocal ? 2 : 5;
  const riskCost = input.parameterScaleM > 300 ? 6 : input.parameterScaleM > 50 ? 3 : 1;
  const bloodlineValue = input.bloodlineCritical ? 9 : 5;
  const reuseValue = input.reusable ? 8 : 3;
  const localSlowValue = isLocal ? 7 : 2;

  // 推荐炉火：>=300M 优先服务器，否则优先本机
  const recommended: ForgeLocation =
    input.parameterScaleM >= 300 ? "GPU_SERVER" : "LOCAL_PC";

  const notes: string[] = [];
  if (isLocal) notes.push("本机慢跑：电费低、注意力切换小、可断点续训。");
  else notes.push("服务器爆发：金钱成本高，但缩短关键路径。");
  if (input.bloodlineCritical) notes.push("血统关键节点：建议预留二次重训预算。");
  if (recommended !== input.forgeLocation) {
    notes.push(`成本计算法建议改为 ${recommended === "GPU_SERVER" ? "服务器" : "本机"}。`);
  }

  return {
    experimentId: input.experimentId,
    moneyCost,
    timeCost,
    attentionCost,
    riskCost,
    bloodlineValue,
    reuseValue,
    localSlowValue,
    recommendedForgeMode: recommended,
    notes,
  };
}

export function buildDefaultCostSamples(): TrainingCostResult[] {
  return [
    estimateTrainingCost({
      experimentId: "LF-TOK-01",
      parameterScaleM: 1,
      expectedHours: 6,
      forgeLocation: "LOCAL_PC",
      reusable: true,
      bloodlineCritical: true,
    }),
    estimateTrainingCost({
      experimentId: "LF-10M-01",
      parameterScaleM: 10,
      expectedHours: 12,
      forgeLocation: "LOCAL_PC",
      reusable: true,
      bloodlineCritical: true,
    }),
    estimateTrainingCost({
      experimentId: "LF-100M-01",
      parameterScaleM: 100,
      expectedHours: 36,
      forgeLocation: "LOCAL_PC",
      reusable: false,
      bloodlineCritical: false,
    }),
    estimateTrainingCost({
      experimentId: "SF-300M-01",
      parameterScaleM: 300,
      expectedHours: 24,
      forgeLocation: "GPU_SERVER",
      reusable: true,
      bloodlineCritical: true,
    }),
    estimateTrainingCost({
      experimentId: "SF-1B5-01",
      parameterScaleM: 1500,
      expectedHours: 80,
      forgeLocation: "GPU_SERVER",
      reusable: true,
      bloodlineCritical: true,
    }),
  ];
}
