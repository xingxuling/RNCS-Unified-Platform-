import type { ChatMessageType } from "@/constants/chat/chatMessageTypes";
import type { ChatIntentResult } from "./chatIntentResolver";
import type { ChatCapabilityCheckResult } from "./chatCapabilityChecker";
import type { WebCodeMResult } from "@/lib/web-codem/webCodeMTypes";
import type { ChatDisplayResult } from "./chatDisplayResultTypes";
import type { ChatCalculusInfo } from "./calculusRouteResultTypes";
import type { FusionRuntimeInfo } from "@/lib/fusion/fusionTypes";


export interface ChatSuggestedAction {
  type: string;
  label: string;
  route?: string;
  payload?: any;
}

export interface ChatAnswerCardData {
  title: string;
  answer: string;
  usedKnowledge?: string[];
}

export interface ChatAskToDoCardData {
  summary: string;
  feasibility: "FEASIBLE" | "PARTIAL" | "INFEASIBLE" | "NEEDS_INFO";
  recommendedPath: { label: string; action: string; route?: string; capability?: string }[];
  requiredCapabilities?: { id: string; installed: boolean; enabled: boolean }[];
}

export interface ChatConfirmationData {
  action: string;
  reason: string;
}

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  role: "user" | "assistant" | "system";
  text?: string;
  intent?: ChatIntentResult;
  capability?: ChatCapabilityCheckResult;
  routeTarget?: { route: string; label: string; reason?: string };
  runResult?: {
    runId?: string;
    runType: string;
    status: string;
    summary: string;
    qaStatus?: string;
    createdObjectId?: string;
  };
  objectInfo?: {
    objectId: string;
    objectType: string;
    title: string;
    summary?: string;
  };
  qaInfo?: { status: "PASS" | "WARN" | "BLOCK"; reasons: string[] };
  blockedReasons?: string[];
  answerCard?: ChatAnswerCardData;
  askToDoCard?: ChatAskToDoCardData;
  confirmation?: ChatConfirmationData;
  webCodeMResult?: WebCodeMResult;
  /** 统一对话结果（所有模块输出的承接层） */
  displayResult?: ChatDisplayResult;
  suggestedActions?: ChatSuggestedAction[];
  createdAt: string;

  /** 流式生成中 */
  streaming?: boolean;
  /** 回答来源 */
  source?: "PROVIDER" | "WEBLLM" | "RULE" | "FALLBACK";
  /** 关联真实 WebLLM run */
  realWebLlmRunId?: string;
  /** 错误信息（fallback / 失败提示） */
  errorText?: string;
  /** 慢速提示（不是错误，仅用于长耗时模型） */
  slowHint?: string;
  /** 真实 LLM Provider 调用元数据 */
  providerInfo?: {
    providerId: string;
    providerType: string;
    chineseName: string;
    modelId: string;
    latencyMs?: number;
    sanitized?: boolean;
    runId?: string;
    /** 本轮使用的 Prompt 模式（轻量 / 规划 / 代码 / 世界 / 治理） */
    promptMode?: string;
    promptModeLabel?: string;
  };
  /** 计算法路由 / Contract / 漂移 / 工具 / 指纹 */
  calculusInfo?: ChatCalculusInfo;
  /** 跨域融合信息：五域 / 引擎权重 / 概念图 / 链 / 常数组 */
  fusionInfo?: FusionRuntimeInfo;
  /** 数列记忆压缩摘要（本轮生成 + 注入历史） */
  memoryInfo?: import("@/lib/sequence-memory/sequenceMemoryTypes").ChatMemorySummary;
  /** 数列货币 / 价值账本计量摘要（折叠显示） */
  currencyInfo?: import("@/lib/sequence-currency/sequenceCurrencyChatBridge").ChatCurrencyInfo;
  /** MSL 数列状态语言：本轮生成的状态帧（CHAT_TURN / FUSION_PLAN 等） */
  mslInfo?: import("@/lib/msl-state/mslChatBridge").ChatMslInfo;
  /** 数列预测结果（仅在预测意图命中时生成） */
  predictionInfo?: import("@/lib/sequence-prediction/sequencePredictionTypes").SequencePredictionResult;
  /** Aether Scheduler：本轮 Chat 创建的调度任务摘要 */
  schedulerInfo?: import("@/lib/scheduler/aetherSchedulerChatBridge").ChatSchedulerSummary;
  /** 旧模块查询结果（识别用户对历史模块的咨询） */
  legacyInfo?: import("@/lib/legacy-modules/legacyModuleChatBridge").ChatLegacyInfo;
  /** 数列 Agent 面板：路由 / 协作模式 / 各 Agent 摘要 / Coordinator 结论 */
  agentInfo?: import("@/lib/sequence-agent/sequenceAgentChatBridge").ChatAgentInfo;
  /** 数列 AI 总调度内核：模式 / 执行计划 / 结论 / MSL */
  sequenceAiInfo?: import("@/lib/sequence-ai/sequenceAiChatBridge").ChatSequenceAiInfo;
  /** Aetherworld 总说明书引导（命中说明书相关查询时） */
  manualInfo?: import("@/lib/system/aetherSystemManual").ChatManualInfo;
  /** 记录中心摘要（命中「最近发生了什么」类查询时） */
  recordInfo?: import("@/lib/record-center/recordCenterChatBridge").ChatRecordCenterInfo;
  /** 开源架构吸收（命中外部架构吸收意图时） */
  openArchInfo?: import("@/lib/open-architecture/openArchitectureChatBridge").ChatOpenArchInfo;
  /** 受控联网读取结果（命中 URL / 联网意图时） */
  networkInfo?: import("@/lib/network/aetherNetworkChatBridge").ChatNetworkInfo;
  /** 同账号项目融合（命中项目融合 / 同账号意图时） */
  projectFusionInfo?: import("@/lib/project-fusion/projectFusionChatBridge").ChatProjectFusionInfo;
  /** 畅想式项目融合（命中畅想 / 跨项目脑暴意图时） */
  imaginativeFusionInfo?: import("@/lib/imaginative-fusion/imaginativeFusionChatBridge").ChatImaginativeFusionInfo;
  /** 分层审计（命中系统式补法 / 哪一层最缺意图时） */
  layerAuditInfo?: import("@/lib/layer-audit/layerAuditChatBridge").ChatLayerAuditInfo;
  /** 个人模型铸造工坊（命中训练 / AetherSeed / 工具链意图时） */
  personalModelForgeInfo?: import("@/lib/personal-model-forge/personalModelForgeChatBridge").ChatPersonalModelForgeInfo;
  /** 训练工厂计算法（命中训练工厂 / 数据权重 / 成本 / 下一代意图时） */
  trainingFactoryCalculusInfo?: import("@/lib/training-factory/trainingFactoryChatBridge").ChatTrainingFactoryCalculusInfo;
  /** 投喂式训练数据铸造炉（命中投喂 / 粘贴训练 / 文件夹投喂意图时） */
  intakeForgeInfo?: import("@/lib/intake-forge/intakeForgeChatBridge").ChatIntakeForgeInfo;
  /** AetherSeed 数据集（命中数据集 / SFT / 导出 / 评测集意图时） */
  datasetInfo?: import("@/lib/aetherseed-dataset/datasetChatBridge").ChatDatasetInfo;
  /** 能力资产市场（命中能力资产化 / 内部能力 / 外部能力 / 用户能力意图时） */
  capabilityAssetInfo?: import("@/lib/capability-assets/capabilityAssetChatBridge").ChatCapabilityAssetInfo;
  /** AetherSeed 本机训练运行器（命中本机训练 / AetherSeed-XXM / Tiny Model 意图时） */
  localTrainingInfo?: import("@/lib/aetherseed-local-training/localTrainingChatBridge").ChatLocalTrainingInfo;
  /** 用户上传出售市场（命中上传文件 / 出售 / 我的资产意图时） */
  userAssetInfo?: import("@/lib/user-asset-upload/userAssetChatBridge").ChatUserAssetInfo;
  /** AetherSeed 实验账本（命中实验 / 训练失败 / checkpoint / 下一炉 / 血统意图时） */
  experimentLedgerInfo?: import("@/lib/aetherseed-experiment-ledger/experimentChatBridge").ChatExperimentLedgerInfo;
  /** AetherSeed 自动训练执行器（命中自动训练 / dry-run / 命令预览意图时） */
  autoTrainingInfo?: import("@/lib/aetherseed-auto-training/autoTrainingChatBridge").ChatAutoTrainingInfo;
  /** AetherSeed 训练工作流编排器（命中训练工作流意图时） */
  trainingWorkflowInfo?: import("@/lib/aetherseed-training-workflow/trainingWorkflowChatBridge").WorkflowChatInfo | null;
  /** Aether Local Execution Gateway（命中本地网关 / 网关启动 / 训练日志 意图时） */
  localGatewayInfo?: import("@/lib/local-execution-gateway/localGatewayChatBridge").ChatLocalGatewayInfo;
  /** AetherSeed 第一炉训练准备（命中点火 / 第一炉 / 准备状态 意图时） */
  firstRunInfo?: import("@/lib/aetherseed-first-run/firstRunChatBridge").ChatFirstRunInfo;
}

export function newMessageId(): string {
  return `MSG-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
