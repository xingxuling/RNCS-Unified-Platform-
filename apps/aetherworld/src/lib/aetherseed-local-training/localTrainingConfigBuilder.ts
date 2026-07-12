// AetherSeed Local Training · 配置构建器（tiny transformer 草案）
import {
  type LocalTrainingConfig,
  type LocalTrainingPlan,
  type LocalTrainingTarget,
  nextLocalTrainingId,
} from "./localTrainingTypes";

interface ModelShape {
  vocabSize: number;
  hiddenSize: number;
  numLayers: number;
  numHeads: number;
  contextLength: number;
  parameterEstimate: string;
}

const MODEL_SHAPE: Record<LocalTrainingTarget, ModelShape> = {
  AETHERSEED_10M: { vocabSize: 8000, hiddenSize: 192, numLayers: 6, numHeads: 6, contextLength: 512, parameterEstimate: "≈10M" },
  AETHERSEED_50M: { vocabSize: 16000, hiddenSize: 384, numLayers: 8, numHeads: 8, contextLength: 1024, parameterEstimate: "≈50M" },
  AETHERSEED_100M: { vocabSize: 16000, hiddenSize: 512, numLayers: 12, numHeads: 8, contextLength: 1024, parameterEstimate: "≈100M" },
  AETHERSEED_300M_PRIVATE: { vocabSize: 32000, hiddenSize: 1024, numLayers: 16, numHeads: 16, contextLength: 2048, parameterEstimate: "≈300M（私有）" },
  ROUTER_TINY: { vocabSize: 8000, hiddenSize: 128, numLayers: 4, numHeads: 4, contextLength: 512, parameterEstimate: "≈3M" },
  MSL_TINY: { vocabSize: 8000, hiddenSize: 128, numLayers: 4, numHeads: 4, contextLength: 512, parameterEstimate: "≈3M" },
  FORMAT_TINY: { vocabSize: 8000, hiddenSize: 128, numLayers: 4, numHeads: 4, contextLength: 1024, parameterEstimate: "≈4M" },
};

interface TrainShape {
  epochs: number;
  batchSize: number;
  learningRate: string;
  precision: string;
  saveEverySteps: number;
  evalEverySteps: number;
}

const TRAIN_SHAPE: Record<LocalTrainingTarget, TrainShape> = {
  AETHERSEED_10M: { epochs: 3, batchSize: 8, learningRate: "3e-4", precision: "fp32", saveEverySteps: 500, evalEverySteps: 200 },
  AETHERSEED_50M: { epochs: 2, batchSize: 4, learningRate: "2e-4", precision: "bf16", saveEverySteps: 1000, evalEverySteps: 500 },
  AETHERSEED_100M: { epochs: 2, batchSize: 2, learningRate: "1.5e-4", precision: "bf16", saveEverySteps: 1000, evalEverySteps: 500 },
  AETHERSEED_300M_PRIVATE: { epochs: 1, batchSize: 1, learningRate: "8e-5", precision: "bf16", saveEverySteps: 200, evalEverySteps: 500 },
  ROUTER_TINY: { epochs: 5, batchSize: 16, learningRate: "5e-4", precision: "fp32", saveEverySteps: 200, evalEverySteps: 100 },
  MSL_TINY: { epochs: 5, batchSize: 16, learningRate: "5e-4", precision: "fp32", saveEverySteps: 200, evalEverySteps: 100 },
  FORMAT_TINY: { epochs: 4, batchSize: 8, learningRate: "4e-4", precision: "fp32", saveEverySteps: 300, evalEverySteps: 150 },
};

export function buildLocalTrainingConfig(
  plan: LocalTrainingPlan,
  trainFile = "train.jsonl",
  evalFile?: string,
  format = "jsonl",
): LocalTrainingConfig {
  const m = MODEL_SHAPE[plan.targetModel];
  const t = TRAIN_SHAPE[plan.targetModel];
  return {
    id: nextLocalTrainingId("LTC"),
    planId: plan.id,
    modelConfig: { ...m },
    trainingConfig: { ...t },
    datasetConfig: { trainFile, evalFile, format },
  };
}

export function configToYaml(cfg: LocalTrainingConfig, plan: LocalTrainingPlan): string {
  const lines: string[] = [];
  lines.push(`# AetherSeed Local Training · config.yaml`);
  lines.push(`# 计划：${plan.name}`);
  lines.push(`# 目标模型：${plan.targetModel}`);
  lines.push(`# 训练模式：${plan.trainingMode}`);
  lines.push(`# 不自动执行；本配置仅用于本机手动训练。`);
  lines.push(``);
  lines.push(`plan_id: "${plan.id}"`);
  lines.push(`target_model: "${plan.targetModel}"`);
  lines.push(`training_mode: "${plan.trainingMode}"`);
  lines.push(``);
  lines.push(`model:`);
  lines.push(`  vocab_size: ${cfg.modelConfig.vocabSize ?? 8000}`);
  lines.push(`  hidden_size: ${cfg.modelConfig.hiddenSize}`);
  lines.push(`  num_layers: ${cfg.modelConfig.numLayers}`);
  lines.push(`  num_heads: ${cfg.modelConfig.numHeads}`);
  lines.push(`  context_length: ${cfg.modelConfig.contextLength}`);
  lines.push(`  parameter_estimate: "${cfg.modelConfig.parameterEstimate}"`);
  lines.push(``);
  lines.push(`training:`);
  lines.push(`  epochs: ${cfg.trainingConfig.epochs}`);
  lines.push(`  batch_size: ${cfg.trainingConfig.batchSize}`);
  lines.push(`  learning_rate: ${cfg.trainingConfig.learningRate}`);
  lines.push(`  precision: "${cfg.trainingConfig.precision}"`);
  lines.push(`  save_every_steps: ${cfg.trainingConfig.saveEverySteps}`);
  lines.push(`  eval_every_steps: ${cfg.trainingConfig.evalEverySteps}`);
  lines.push(``);
  lines.push(`dataset:`);
  lines.push(`  train_file: "${cfg.datasetConfig.trainFile}"`);
  if (cfg.datasetConfig.evalFile) lines.push(`  eval_file: "${cfg.datasetConfig.evalFile}"`);
  lines.push(`  format: "${cfg.datasetConfig.format}"`);
  lines.push(``);
  return lines.join("\n");
}
