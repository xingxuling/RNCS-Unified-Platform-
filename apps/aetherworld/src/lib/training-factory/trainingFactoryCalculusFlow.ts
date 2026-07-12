// 训练工厂计算法 · 15 步流程定义
import type { TrainingFactoryCalculusReport } from "./trainingFactoryTypes";

export const CALCULUS_FLOW: TrainingFactoryCalculusReport["calculusFlow"] = [
  {
    id: "STEP-01-CORPUS",
    name: "CorpusIngestion · 语料采集",
    description: "从 Chat / Memory / Record / Workspace / Network / OpenArchitecture 汇聚语料原料。",
    outputs: ["RawCorpus"],
  },
  {
    id: "STEP-02-SAFETY",
    name: "SafetySanitization · 脱敏与安全过滤",
    description: "走 Secret Guard / Safety Policy，剔除密钥 / Founder-only / Full60 原始数列。",
    outputs: ["SanitizedCorpus"],
  },
  {
    id: "STEP-03-CLASSIFY",
    name: "DataClassification · 数据归类",
    description: "按 sourceType / 任务类型 / 抽象层级归类。",
    outputs: ["ClassifiedCorpus"],
  },
  {
    id: "STEP-04-SAMPLE",
    name: "SampleGeneration · 样本生成",
    description: "将分类语料编译为 instruction / chat / MSL / router 样本。",
    outputs: ["TrainingSample[]"],
  },
  {
    id: "STEP-05-MIX",
    name: "DatasetMixture · 数据混合",
    description: "按 DatasetWeightCalculus 混合不同来源，输出 DatasetVersion。",
    outputs: ["DatasetVersion"],
  },
  {
    id: "STEP-06-RECIPE",
    name: "TrainingRecipeBuild · 训练配方生成",
    description: "选择基座模型、训练方法（Pretrain/SFT/LoRA/QLoRA/DPO/Tokenizer）与超参草案。",
    outputs: ["TrainingRecipe"],
  },
  {
    id: "STEP-07-FORGE",
    name: "ForgeAssignment · 炉火分配",
    description: "按 TrainingCostCalculus 分配 LOCAL_PC / GPU_SERVER / HYBRID。",
    outputs: ["ForgeLocation"],
  },
  {
    id: "STEP-08-EXEC",
    name: "TrainingExecutionPlan · 训练执行计划",
    description: "生成可由用户手动启动的执行 Runbook，Aetherworld 不自动运行。",
    outputs: ["TrainingExperimentPlan"],
  },
  {
    id: "STEP-09-EVAL",
    name: "EvalPlanBuild · 评测计划生成",
    description: "生成针对样本能力 / MSL / 数列语言 / 结构化输出的 EvalSet 草案。",
    outputs: ["EvalPlan"],
  },
  {
    id: "STEP-10-REGISTRY",
    name: "ModelRegistryUpdate · 模型登记",
    description: "向 ModelRegistry 登记 ModelArtifact 与血统线归属。",
    outputs: ["ModelArtifact"],
  },
  {
    id: "STEP-11-PROVIDER",
    name: "ProviderImportPlan · Provider 接入计划",
    description: "生成 Ollama / OpenAI-Compat / WebLLM 接入步骤（仅手动执行）。",
    outputs: ["ProviderImportPlan"],
  },
  {
    id: "STEP-12-RUNTIME",
    name: "RuntimeEvaluation · 运行时评测",
    description: "通过现有 Provider 在 Aetherworld 内调用并打分，不参与训练循环。",
    outputs: ["RuntimeEvalResult"],
  },
  {
    id: "STEP-13-RECORD",
    name: "RecordVerification · 记录与回验",
    description: "训练 / 评测事件写入 Record Center 与 Verification Center。",
    outputs: ["RecordEvent", "VerificationDraft"],
  },
  {
    id: "STEP-14-REWEIGHT",
    name: "DatasetReweighting · 数据重加权",
    description: "根据评测与回验结果调整 datasetWeight，下一代复用。",
    outputs: ["UpdatedDatasetWeight"],
  },
  {
    id: "STEP-15-NEXT",
    name: "NextGenerationPlan · 下一代模型计划",
    description: "结合血统线 / 评测 / 成本，生成下一代 AetherSeed 的训练蓝图。",
    outputs: ["NextGenerationPlan"],
  },
];
