// 递归自举：每代 AetherSeed 反哺训练工厂的能力地图
import type { RecursiveTrainingPlanStage } from "./trainingFactoryTypes";

export function buildRecursiveTrainingPlan(): RecursiveTrainingPlanStage[] {
  return [
    {
      bloodlineStageId: "BL-50M",
      modelName: "AetherSeed-50M",
      feedbackCapabilities: ["样本分类", "MSL 模板生成"],
      feedbackTargets: ["DataClassification", "SampleGeneration"],
    },
    {
      bloodlineStageId: "BL-100M",
      modelName: "AetherSeed-100M",
      feedbackCapabilities: ["简单 Router 样本生成", "Lovable Prompt 骨架生成"],
      feedbackTargets: ["SampleGeneration", "TrainingRecipeBuild"],
    },
    {
      bloodlineStageId: "BL-300M",
      modelName: "AetherSeed-300M",
      feedbackCapabilities: ["数据清洗建议", "Agent 摘要", "训练样本扩增"],
      feedbackTargets: ["SafetySanitization", "DatasetMixture", "SampleGeneration"],
    },
    {
      bloodlineStageId: "BL-700M",
      modelName: "AetherSeed-700M",
      feedbackCapabilities: ["评测题生成", "错误归因", "下一代训练建议"],
      feedbackTargets: ["EvalPlanBuild", "DatasetReweighting", "NextGenerationPlan"],
    },
    {
      bloodlineStageId: "BL-1B5",
      modelName: "AetherSeed-1.5B",
      feedbackCapabilities: [
        "参与数据混合决策",
        "生成训练计划草案",
        "辅助 Product Self-Evolution",
      ],
      feedbackTargets: ["DatasetMixture", "TrainingExecutionPlan", "NextGenerationPlan"],
    },
    {
      bloodlineStageId: "BL-3B",
      modelName: "AetherSeed-3B",
      feedbackCapabilities: ["成为训练工厂内部主要模型之一"],
      feedbackTargets: ["全部 15 步流程"],
    },
  ];
}
