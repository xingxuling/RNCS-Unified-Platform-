// Training Factory Calculus · 运行时入口
import { runPersonalModelForge } from "@/lib/personal-model-forge/personalModelForgeRuntime";
import type {
  DatasetVersion,
  EvalPlan,
  NextGenerationPlan,
  ProviderImportPlan,
  TrainingExperimentPlan,
  TrainingFactoryCalculusReport,
  TrainingRecipe,
} from "./trainingFactoryTypes";
import { CALCULUS_FLOW } from "./trainingFactoryCalculusFlow";
import { buildQuadrants } from "./trainingFactoryQuadrants";
import { buildRecursiveTrainingPlan } from "./recursiveTrainingPlanner";
import { buildDefaultCostSamples } from "./trainingCostCalculator";
import { buildDefaultWeightSamples } from "./datasetWeightCalculator";

function buildDatasetVersions(): DatasetVersion[] {
  return [
    {
      id: "DSV-AETHER-CORE-V0",
      name: "Aether Core Mix v0",
      versionTag: "v0.1",
      sampleSources: [
        "CHAT_COMPRESSION", "MSL", "SEQUENCE_MEMORY", "LOVABLE_PROMPT", "BUG_AUDIT",
      ],
      estimatedSampleCount: 4000,
      mixtureWeights: {
        CHAT_COMPRESSION: 0.35,
        MSL: 0.2,
        SEQUENCE_MEMORY: 0.2,
        LOVABLE_PROMPT: 0.15,
        BUG_AUDIT: 0.1,
      },
      description: "AetherSeed-10M / 50M 通用编译数据集草案。",
    },
    {
      id: "DSV-MSL-ROUTER-V0",
      name: "MSL Router Mix v0",
      versionTag: "v0.1",
      sampleSources: ["MSL", "SCHEDULER_TASK", "AGENT_RUN"],
      estimatedSampleCount: 1200,
      mixtureWeights: { MSL: 0.5, SCHEDULER_TASK: 0.3, AGENT_RUN: 0.2 },
      description: "为 Router / MSL 小模型准备。",
    },
    {
      id: "DSV-WORLD-LANG-V0",
      name: "World Language Mix v0",
      versionTag: "v0.1",
      sampleSources: ["WORKSPACE_OBJECT", "RECORD_EVENT", "NETWORK_CORPUS"],
      estimatedSampleCount: 3000,
      mixtureWeights: {
        WORKSPACE_OBJECT: 0.4, RECORD_EVENT: 0.3, NETWORK_CORPUS: 0.3,
      },
      description: "世界叙事 / 记录回放风格数据集。",
    },
  ];
}

function buildRecipes(): TrainingRecipe[] {
  return [
    {
      id: "RCP-TOK-V0",
      name: "AetherSeed Tokenizer v0",
      baseModel: "—",
      method: "TOKENIZER",
      hyperParams: { vocab_size: 32000, type: "BPE" },
      forgeLocation: "LOCAL_PC",
      estimatedDuration: "≈ 6 小时",
    },
    {
      id: "RCP-10M-PRETRAIN",
      name: "AetherSeed-10M Pretrain",
      baseModel: "tiny-decoder-10M",
      method: "PRETRAIN",
      hyperParams: { lr: 3e-4, batch: 16, steps: 20000 },
      forgeLocation: "LOCAL_PC",
      estimatedDuration: "≈ 12 小时",
    },
    {
      id: "RCP-100M-SFT",
      name: "AetherSeed-100M SFT",
      baseModel: "AetherSeed-100M-base",
      method: "SFT",
      hyperParams: { lr: 1e-5, epochs: 2 },
      forgeLocation: "LOCAL_PC",
      estimatedDuration: "≈ 36 小时",
    },
    {
      id: "RCP-300M-PRETRAIN",
      name: "AetherSeed-300M Pretrain (Server)",
      baseModel: "decoder-300M",
      method: "PRETRAIN",
      hyperParams: { lr: 2e-4, batch: 256, steps: 80000 },
      forgeLocation: "GPU_SERVER",
      estimatedDuration: "≈ 24 小时",
    },
    {
      id: "RCP-LORA-Q",
      name: "QLoRA · Aether 微调",
      baseModel: "Qwen / Llama 基座（用户手动选择）",
      method: "QLORA",
      hyperParams: { rank: 16, lr: 2e-4 },
      forgeLocation: "LOCAL_PC",
      estimatedDuration: "≈ 4-10 小时",
    },
  ];
}

function buildEvalPlans(): EvalPlan[] {
  return [
    {
      id: "EVAL-CORE-V0",
      name: "AetherSeed Core Eval v0",
      items: [
        { id: "EV-FMT", name: "结构化格式还原", metric: "JSON 合法率", sampleSource: "MSL/Structured" },
        { id: "EV-MSL", name: "MSL opcode 命中", metric: "opcode hit-rate", sampleSource: "MSL" },
        { id: "EV-SEQ", name: "数列保留率", metric: "sequence retain", sampleSource: "Memory" },
        { id: "EV-CHAT", name: "Aetherworld 对话覆盖", metric: "intent hit", sampleSource: "Chat" },
      ],
      passCriteria: "JSON 合法率 ≥ 90% · MSL opcode 命中 ≥ 70% · 数列保留率 ≥ 60%",
    },
    {
      id: "EVAL-ROUTER",
      name: "Router Eval",
      items: [
        { id: "EV-ROUTE", name: "意图路由准确率", metric: "accuracy", sampleSource: "Router" },
      ],
      passCriteria: "准确率 ≥ 85%",
    },
  ];
}

function buildExperiments(): TrainingExperimentPlan[] {
  return [
    {
      id: "EXP-LF-TOK-01",
      name: "本机 · 训练 AetherSeed Tokenizer v0",
      targetModel: "AetherSeed Tokenizer v0",
      recipeId: "RCP-TOK-V0",
      datasetVersionId: "DSV-AETHER-CORE-V0",
      forgeLocation: "LOCAL_PC",
      status: "DRAFT",
      goal: "为后续 10M / 50M 模型提供统一分词器。",
      evalPlanId: "EVAL-CORE-V0",
      nextStep: "用户在本机夜间手动启动。",
    },
    {
      id: "EXP-LF-10M-01",
      name: "本机 · 跑通 AetherSeed-10M 全管线",
      targetModel: "AetherSeed-10M",
      recipeId: "RCP-10M-PRETRAIN",
      datasetVersionId: "DSV-AETHER-CORE-V0",
      forgeLocation: "LOCAL_PC",
      status: "DRAFT",
      goal: "验证训练管线、checkpoint、评测完整闭环。",
      evalPlanId: "EVAL-CORE-V0",
      nextStep: "Tokenizer 通过后立即排队。",
    },
    {
      id: "EXP-LF-100M-01",
      name: "本机 · AetherSeed-100M SFT 试跑",
      targetModel: "AetherSeed-100M",
      recipeId: "RCP-100M-SFT",
      datasetVersionId: "DSV-MSL-ROUTER-V0",
      forgeLocation: "LOCAL_PC",
      status: "DRAFT",
      goal: "测试结构化输出与 MSL 命中。",
      evalPlanId: "EVAL-CORE-V0",
      nextStep: "在 10M 管线稳定后再排。",
    },
    {
      id: "EXP-SF-300M-01",
      name: "服务器 · AetherSeed-300M 预训练",
      targetModel: "AetherSeed-300M",
      recipeId: "RCP-300M-PRETRAIN",
      datasetVersionId: "DSV-AETHER-CORE-V0",
      forgeLocation: "GPU_SERVER",
      status: "DRAFT",
      goal: "形成首个弱通用基座。",
      evalPlanId: "EVAL-CORE-V0",
      nextStep: "完成 SERVER_PREP_CHECKLIST 后由用户手动启动。",
    },
  ];
}

function buildProviderImportPlans(): ProviderImportPlan[] {
  return [
    {
      id: "PIP-OLLAMA-LOCAL",
      targetModelId: "AetherSeed-10M",
      provider: "OLLAMA",
      steps: [
        "导出 GGUF 权重（用户在本机手动执行）",
        "编写 Modelfile（参数 + 提示模板）",
        "ollama create aetherseed-10m -f Modelfile",
        "在 Aetherworld /llm-providers 选择 Ollama 并选择模型",
      ],
      manualOnly: true,
    },
    {
      id: "PIP-WEBLLM",
      targetModelId: "AetherSeed-50M",
      provider: "WEBLLM",
      steps: [
        "导出为 WebLLM 兼容格式（用户手动执行）",
        "在 /real-webllm 配置模型清单",
        "Aetherworld 内手动加载并对照评测",
      ],
      manualOnly: true,
    },
  ];
}

function buildNextGenerationPlans(): NextGenerationPlan[] {
  return [
    {
      fromBloodlineStageId: "BL-10M",
      toBloodlineStageId: "BL-50M",
      reason: "管线通过后扩展规模，验证 MSL / 数列语言覆盖。",
      dependsOn: ["Tokenizer 通过", "EVAL-CORE-V0 基线达标"],
      estimatedCalendar: "约 1-2 周（本机夜间）",
    },
    {
      fromBloodlineStageId: "BL-100M",
      toBloodlineStageId: "BL-300M",
      reason: "进入服务器爆发段，形成弱通用基座。",
      dependsOn: ["SERVER_PREP_CHECKLIST", "DSV-AETHER-CORE-V0 重加权"],
      estimatedCalendar: "约 1-2 周（服务器）",
    },
    {
      fromBloodlineStageId: "BL-700M",
      toBloodlineStageId: "BL-1B5",
      reason: "评测题与错误归因可由 700M 自动生成，进入主力工作模型。",
      dependsOn: ["EVAL-CORE-V0 全面通过", "DatasetReweighting 自动化草案"],
      estimatedCalendar: "约 1 月（服务器）",
    },
  ];
}

export function runTrainingFactoryCalculus(): TrainingFactoryCalculusReport {
  const forge = runPersonalModelForge();
  const quadrants = buildQuadrants();
  const recursivePlan = buildRecursiveTrainingPlan();
  const costSamples = buildDefaultCostSamples();
  const weightSamples = buildDefaultWeightSamples();
  const datasetVersions = buildDatasetVersions();
  const recipes = buildRecipes();
  const experiments = buildExperiments();
  const evalPlans = buildEvalPlans();
  const providerImportPlans = buildProviderImportPlans();
  const nextGenerationPlans = buildNextGenerationPlans();

  const summary =
    "训练工厂不只是页面，而是 Aetherworld 把语料种子编译成模型血统的 15 步计算法。" +
    `当前血统线 ${forge.bloodline.length} 级、数据集草案 ${datasetVersions.length} 套、` +
    `训练实验 ${experiments.length} 项、评测计划 ${evalPlans.length} 套。`;

  return {
    generatedAt: new Date().toISOString(),
    calculusFlow: CALCULUS_FLOW,
    quadrants,
    bloodline: forge.bloodline.map((b) => ({
      id: b.id,
      modelName: b.modelName,
      parameterScale: b.parameterScale,
      forgeLocation: b.forgeLocation,
    })),
    recursivePlan,
    costSamples,
    weightSamples,
    nextGenerationPlans,
    datasetVersions,
    recipes,
    experiments,
    evalPlans,
    providerImportPlans,
    summary,
  };
}
