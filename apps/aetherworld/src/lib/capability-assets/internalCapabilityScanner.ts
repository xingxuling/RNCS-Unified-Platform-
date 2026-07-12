// 内部能力扫描：识别 Aetherworld 内部可资产化的引擎 / 计算法 / Prompt / Workflow / 训练工具 / Agent / 企业模块
import type {
  CapabilityAssetCandidate,
  CapabilityInstallMode,
  CapabilityPackageType,
  CapabilityMonetization,
} from "./capabilityAssetTypes";

interface InternalSeed {
  ref: string;
  cnTitle: string;
  title: string;
  packageType: CapabilityPackageType;
  valueReason: string;
  installMode?: CapabilityInstallMode;
  monetization?: CapabilityMonetization;
}

const INTERNAL_SEEDS: InternalSeed[] = [
  // 训练工具
  { ref: "intake-forge", title: "Intake Forge", cnTitle: "投喂式训练数据铸造炉",
    packageType: "TRAINING_TOOL", valueReason: "粘贴 / 文件 / 文件夹一键转训练候选，所有用户可重复使用。",
    installMode: "ONE_CLICK", monetization: "FREE" },
  { ref: "dataset-builder", title: "AetherSeed Dataset Builder", cnTitle: "AetherSeed 数据集构建器",
    packageType: "TRAINING_TOOL", valueReason: "把投喂候选收编成正式版本化数据集。",
    installMode: "ONE_CLICK", monetization: "FREE" },
  { ref: "dataset-real-export", title: "Dataset Real Export", cnTitle: "数据集真实文件导出",
    packageType: "TRAINING_TOOL", valueReason: "TXT / JSONL / ChatML / Alpaca 真实下载，含安全报告。",
    installMode: "ONE_CLICK", monetization: "FREE" },
  { ref: "local-training-runner", title: "Local Training Runner", cnTitle: "本机训练运行器",
    packageType: "TRAINING_TOOL", valueReason: "生成 train.py / config.yaml / runbook，本机慢速训练蓝图。",
    installMode: "DOWNLOAD_FILE", monetization: "FREE" },
  { ref: "personal-model-forge", title: "Personal Model Forge", cnTitle: "个人模型铸造工坊",
    packageType: "TRAINING_TOOL", valueReason: "从需求 → 训练蓝图 → Provider 接入的端到端引导。",
    installMode: "ONE_CLICK", monetization: "FREE" },

  // 引擎
  { ref: "fusion-runtime", title: "Fusion Runtime", cnTitle: "跨域融合运行时",
    packageType: "ENGINE", valueReason: "五域融合 / 漂移检测 / 概念图，Aetherworld 心脏。",
    installMode: "REFERENCE_ONLY", monetization: "ENTERPRISE" },
  { ref: "sequence-memory", title: "Sequence Memory", cnTitle: "数列记忆引擎",
    packageType: "ENGINE", valueReason: "Chat 历史压缩与召回，承载长期记忆。",
    installMode: "REFERENCE_ONLY", monetization: "ENTERPRISE" },
  { ref: "msl-state-engine", title: "MSL State Engine", cnTitle: "MSL 数列状态语言",
    packageType: "ENGINE", valueReason: "状态帧统一表达，可被任何模块复用。",
    installMode: "REFERENCE_ONLY", monetization: "ENTERPRISE" },
  { ref: "scheduler", title: "Aether Scheduler", cnTitle: "Aether 调度器",
    packageType: "ENGINE", valueReason: "任务编排核心，跨模块协调。",
    installMode: "REFERENCE_ONLY", monetization: "ENTERPRISE" },
  { ref: "record-center", title: "Record Center", cnTitle: "记录中心",
    packageType: "ENGINE", valueReason: "全局事件流，回验 / 审计核心。",
    installMode: "REFERENCE_ONLY", monetization: "FREE" },
  { ref: "analytics", title: "Analytics", cnTitle: "分析引擎",
    packageType: "ENGINE", valueReason: "时序指标与异常预警基座。",
    installMode: "REFERENCE_ONLY", monetization: "FREE" },
  { ref: "open-architecture-absorption", title: "Open Architecture Absorption", cnTitle: "开源架构吸收引擎",
    packageType: "ENGINE", valueReason: "把外部架构变成 WebXXM 草案。",
    installMode: "REFERENCE_ONLY", monetization: "ENTERPRISE" },

  // 计算法
  { ref: "civilization-seed-calculus", title: "Civilization Seed Calculus", cnTitle: "文明种子编译计算法",
    packageType: "CALCULUS", valueReason: "需求 → 系统骨架的源生成法。",
    installMode: "COPY_PROMPT", monetization: "FREE" },
  { ref: "training-factory-calculus", title: "Training Factory Calculus", cnTitle: "模型训练工厂计算法",
    packageType: "CALCULUS", valueReason: "四象拆解 + 成本 + 数据权重 + 血统路线。",
    installMode: "COPY_PROMPT", monetization: "FREE" },
  { ref: "open-architecture-calculus", title: "Open Architecture Absorption Calculus", cnTitle: "开源架构吸收计算法",
    packageType: "CALCULUS", valueReason: "外部架构 → 草案的形式化过程。",
    installMode: "COPY_PROMPT", monetization: "FREE" },
  { ref: "project-fusion-calculus", title: "Project Fusion Calculus", cnTitle: "项目融合计算法",
    packageType: "CALCULUS", valueReason: "同账号项目融合的判定与桥接。",
    installMode: "COPY_PROMPT", monetization: "FREE" },
  { ref: "product-self-evolution", title: "Product Self-Evolution Calculus", cnTitle: "产品自进化计算法",
    packageType: "CALCULUS", valueReason: "下一轮路线自动生成。",
    installMode: "COPY_PROMPT", monetization: "ENTERPRISE" },
  { ref: "sequence-prediction-calculus", title: "Sequence Prediction Calculus", cnTitle: "数列预测计算法",
    packageType: "CALCULUS", valueReason: "通用时序 / 模式预测。",
    installMode: "COPY_PROMPT", monetization: "FREE" },
  { ref: "lovable-handoff-calculus", title: "Lovable Handoff Calculus", cnTitle: "Lovable 移交计算法",
    packageType: "CALCULUS", valueReason: "把任务规范化为高规格 Lovable Prompt。",
    installMode: "COPY_PROMPT", monetization: "FREE" },

  // Prompt
  { ref: "lovable-high-spec-prompt", title: "Lovable High-Spec Prompt", cnTitle: "Lovable 高规格 Prompt",
    packageType: "PROMPT", valueReason: "高确定性、可移交的 Lovable Prompt 模板。",
    installMode: "COPY_PROMPT", monetization: "FREE" },
  { ref: "bug-audit-prompt", title: "Bug Audit Prompt", cnTitle: "Bug 检查 Prompt",
    packageType: "PROMPT", valueReason: "标准化的系统 Bug 审计任务模板。",
    installMode: "COPY_PROMPT", monetization: "FREE" },
  { ref: "p0-safety-closeout-prompt", title: "P0 Safety Closeout Prompt", cnTitle: "P0 安全收口 Prompt",
    packageType: "PROMPT", valueReason: "把关键安全风险一次性收口。",
    installMode: "COPY_PROMPT", monetization: "FREE" },
  { ref: "training-factory-prompt", title: "Training Factory Prompt", cnTitle: "训练工厂 Prompt",
    packageType: "PROMPT", valueReason: "训练工厂调用的标准 Prompt。",
    installMode: "COPY_PROMPT", monetization: "FREE" },
  { ref: "agent-runtime-prompt", title: "Agent Runtime Prompt", cnTitle: "Agent 运行时 Prompt",
    packageType: "PROMPT", valueReason: "Sequence Agent 协作模式 Prompt。",
    installMode: "COPY_PROMPT", monetization: "FREE" },

  // 工作流
  { ref: "wf-intake-to-training", title: "Intake → Dataset → Export → Local Training", cnTitle: "投喂 → 数据集 → 导出 → 本机训练",
    packageType: "WORKFLOW", valueReason: "完整离线训练流水线。",
    installMode: "IMPORT_JSON", monetization: "FREE" },
  { ref: "wf-record-to-evolution", title: "Record → Verify → Weight → Self-Evolution", cnTitle: "记录 → 回验 → 权重 → 自进化",
    packageType: "WORKFLOW", valueReason: "产品自进化主回路。",
    installMode: "IMPORT_JSON", monetization: "ENTERPRISE" },
  { ref: "wf-open-arch-to-webxxm", title: "Open Source → Absorption → WebXXM Draft", cnTitle: "开源项目 → 架构吸收 → WebXXM 草案",
    packageType: "WORKFLOW", valueReason: "外部架构资产化主路径。",
    installMode: "IMPORT_JSON", monetization: "ENTERPRISE" },

  // Agent
  { ref: "sequence-agent", title: "Sequence Agent", cnTitle: "数列 Agent",
    packageType: "AGENT", valueReason: "多 Agent 协作的统一接口。",
    installMode: "REFERENCE_ONLY", monetization: "ENTERPRISE" },
  { ref: "sequence-ai-core", title: "Sequence AI Core", cnTitle: "数列 AI 总调度内核",
    packageType: "AGENT", valueReason: "意图 → 计划 → 执行内核。",
    installMode: "REFERENCE_ONLY", monetization: "ENTERPRISE" },

  // 企业模块
  { ref: "enterprise-handoff-pack", title: "Enterprise Handoff Pack", cnTitle: "企业移交包",
    packageType: "ENTERPRISE_MODULE", valueReason: "面向企业的整套移交方案。",
    installMode: "ENTERPRISE_CONTACT", monetization: "ENTERPRISE" },
];

export function scanInternalCapabilityCandidates(): CapabilityAssetCandidate[] {
  return INTERNAL_SEEDS.map((s, idx) => ({
    id: `CAC-INT-${idx + 1}`,
    sourceType: "INTERNAL_CAPABILITY",
    sourceRef: s.ref,
    candidateType: s.packageType,
    title: s.title,
    cnTitle: s.cnTitle,
    valueReason: s.valueReason,
    suggestedPackageType: s.packageType,
    suggestedInstallMode: s.installMode ?? "REFERENCE_ONLY",
    suggestedMonetization: s.monetization ?? "FREE",
    riskLevel: "LOW",
    safetyStatus: "PASS",
    ownershipStatus: "OWNED",
    shouldAssetizeNow: true,
    shouldRequireReview: false,
    notes: "Aetherworld 内部能力，所有权清晰，可直接资产化。",
  }));
}
