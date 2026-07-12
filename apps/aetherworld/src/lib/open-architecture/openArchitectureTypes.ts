// 开源架构吸收运行时 · 类型定义
// 用于把外部开源项目 / 框架 / Agent / 插件 / UI / 工作流吸收为 Aetherworld 内部资产。

export type OpenArchitectureSourceType =
  | "GITHUB_REPO"
  | "README"
  | "CODE_SNIPPET"
  | "DOCS"
  | "LOCAL_PROJECT"
  | "LOVABLE_PROJECT"
  | "MANUAL_DESCRIPTION"
  | "URL"
  | "PACKAGE";

export interface OpenArchitectureSource {
  id: string;
  sourceType: OpenArchitectureSourceType;
  title: string;
  url?: string;
  rawText?: string;
  fileTree?: string;
  languageHints?: string[];
  createdAt: string;
}

export type OpenArchitectureModuleLayer =
  | "UI"
  | "API"
  | "RUNTIME"
  | "DATA"
  | "MODEL"
  | "AGENT"
  | "PLUGIN"
  | "WORKFLOW"
  | "SECURITY"
  | "OBSERVABILITY"
  | "OTHER";

export interface OpenArchitectureModule {
  id: string;
  name: string;
  role: string;
  layer: OpenArchitectureModuleLayer;
  mappableToAether: string[];
  confidence: number; // 0–1
}

export type OpenArchitectureCapabilityType =
  | "MODEL_PROVIDER"
  | "AGENT_TOOL"
  | "WORKFLOW"
  | "PLUGIN"
  | "UI_PATTERN"
  | "DATA_SOURCE"
  | "SANDBOX"
  | "MEMORY"
  | "ANALYTICS"
  | "SCHEDULER"
  | "STORE_PACKAGE"
  | "OTHER";

export interface OpenArchitectureCapability {
  id: string;
  name: string;
  description: string;
  capabilityType: OpenArchitectureCapabilityType;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  suggestedAetherTarget: string[];
}

export type OpenArchitectureAbsorptionLevel =
  | "ABSORB_NOW"
  | "REFERENCE_ONLY"
  | "BRIDGE_LATER"
  | "STORE_PACKAGE"
  | "AGENT_TOOL"
  | "RISKY"
  | "IGNORE";

export interface OpenArchitectureAnalysis {
  id: string;
  sourceId: string;
  projectType: string;
  techStack: string[];
  architecturePattern: string[];
  modules: OpenArchitectureModule[];
  capabilities: OpenArchitectureCapability[];
  dataFlow: string[];
  uiFlow: string[];
  runtimeFlow: string[];
  securityBoundaries: string[];
  dependencies: string[];
  risks: string[];
  absorptionLevel: OpenArchitectureAbsorptionLevel;
  createdAt: string;
}

export type OpenArchitectureBridgeType =
  | "WEBXXM_PACKAGE"
  | "SCHEDULER_TOOL"
  | "SEQUENCE_AGENT_TOOL"
  | "LOCAL_GATEWAY_PLUGIN"
  | "APP_TEMPLATE"
  | "CODE_SANDBOX_TEMPLATE"
  | "WORKSPACE_OBJECT"
  | "REFERENCE_ONLY";

export interface OpenArchitectureBridgePlan {
  id: string;
  analysisId: string;
  targetSystems: string[];
  bridgeType: OpenArchitectureBridgeType;
  steps: string[];
  requiredPermissions: string[];
  risks: string[];
  recommendedPriority: "P0" | "P1" | "P2" | "P3";
  lovablePromptDraft?: string;
}

export interface WebXXMPackageDraft {
  packageName: string;
  capabilityType: OpenArchitectureCapabilityType;
  permissions: string[];
  inputSchema: string;
  outputSchema: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  installRequirements: string[];
  usageExamples: string[];
}

export const ABSORPTION_LEVEL_LABEL: Record<OpenArchitectureAbsorptionLevel, string> = {
  ABSORB_NOW: "立刻吸收",
  REFERENCE_ONLY: "仅作参考",
  BRIDGE_LATER: "稍后桥接",
  STORE_PACKAGE: "商店化（WebXXM）",
  AGENT_TOOL: "数列 Agent 工具",
  RISKY: "高风险待评审",
  IGNORE: "忽略",
};

export const BRIDGE_TYPE_LABEL: Record<OpenArchitectureBridgeType, string> = {
  WEBXXM_PACKAGE: "WebXXM 能力包",
  SCHEDULER_TOOL: "调度器工具",
  SEQUENCE_AGENT_TOOL: "数列 Agent 工具",
  LOCAL_GATEWAY_PLUGIN: "本机网关插件",
  APP_TEMPLATE: "App 模板",
  CODE_SANDBOX_TEMPLATE: "代码沙盒模板",
  WORKSPACE_OBJECT: "工作区对象",
  REFERENCE_ONLY: "仅架构参考",
};

export const LAYER_LABEL: Record<OpenArchitectureModuleLayer, string> = {
  UI: "界面层",
  API: "接口层",
  RUNTIME: "运行时",
  DATA: "数据层",
  MODEL: "模型层",
  AGENT: "Agent 层",
  PLUGIN: "插件层",
  WORKFLOW: "工作流",
  SECURITY: "安全层",
  OBSERVABILITY: "可观测",
  OTHER: "其他",
};

export const CAPABILITY_TYPE_LABEL: Record<OpenArchitectureCapabilityType, string> = {
  MODEL_PROVIDER: "模型提供者",
  AGENT_TOOL: "Agent 工具",
  WORKFLOW: "工作流",
  PLUGIN: "插件",
  UI_PATTERN: "UI 模式",
  DATA_SOURCE: "数据源",
  SANDBOX: "沙盒",
  MEMORY: "记忆 / 向量",
  ANALYTICS: "可观测 / 指标",
  SCHEDULER: "调度",
  STORE_PACKAGE: "商店能力包",
  OTHER: "其他",
};
