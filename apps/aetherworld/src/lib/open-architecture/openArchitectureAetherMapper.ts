// 开源架构 → Aetherworld 映射 + 吸收等级判定 + Bridge Plan 生成 + WebXXM 包草案

import type {
  OpenArchitectureAnalysis,
  OpenArchitectureModule,
  OpenArchitectureBridgePlan,
  OpenArchitectureBridgeType,
  OpenArchitectureAbsorptionLevel,
  WebXXMPackageDraft,
} from "./openArchitectureTypes";
import { nextOaId } from "./openArchitectureAnalyzer";

// 模块层 → Aetherworld 系统映射规则（与说明对应）
export const AETHER_MAPPING: Record<string, string[]> = {
  "插件系统": ["Store / WebXXM"],
  "Agent 子系统": ["Sequence Agent Runtime"],
  "工作流引擎": ["Scheduler Runtime"],
  "记忆 / 向量层": ["Sequence Memory", "WebLCM", "Workspace"],
  "可观测层": ["Analytics Runtime", "Record Center", "MSL State Language"],
  "状态机": ["MSL State Language", "Scheduler"],
  "提示词系统": ["计算法链", "常数宇宙"],
  "本机守护进程": ["Local Gateway"],
  "界面层": ["Responsive Shell", "UI 模式库"],
  "沙盒 / 隔离": ["Code Sandbox", "Local Gateway", "Permission Guard"],
  "模型 Provider": ["Ollama / LLM Provider"],
  "接口层": ["TanStack Server Route", "App Runtime"],
};

export function applyAetherMapping(modules: OpenArchitectureModule[]): OpenArchitectureModule[] {
  return modules.map((m) => {
    const extra = AETHER_MAPPING[m.name] ?? [];
    const merged = Array.from(new Set([...(m.mappableToAether ?? []), ...extra]));
    return { ...m, mappableToAether: merged };
  });
}

// 吸收等级判定
export function decideAbsorptionLevel(analysis: Omit<OpenArchitectureAnalysis, "absorptionLevel">): OpenArchitectureAbsorptionLevel {
  const highRiskHits = analysis.risks.filter((r) => /高权限|GPL|AGPL|SSPL|eval|shell|出境/.test(r)).length;
  const pluginModule = analysis.modules.find((m) => m.layer === "PLUGIN");
  const agentModule = analysis.modules.find((m) => m.layer === "AGENT");
  const valuableMappings = analysis.modules.filter((m) => m.mappableToAether.length > 0).length;

  if (highRiskHits >= 2) return "RISKY";
  if (pluginModule) return "STORE_PACKAGE";
  if (agentModule) return "AGENT_TOOL";
  if (valuableMappings >= 3) return "ABSORB_NOW";
  if (valuableMappings >= 1) return "BRIDGE_LATER";
  if (analysis.modules.length === 0) return "IGNORE";
  return "REFERENCE_ONLY";
}

// Bridge 类型决定
function decideBridgeType(level: OpenArchitectureAbsorptionLevel): OpenArchitectureBridgeType {
  switch (level) {
    case "STORE_PACKAGE": return "WEBXXM_PACKAGE";
    case "AGENT_TOOL":    return "SEQUENCE_AGENT_TOOL";
    case "ABSORB_NOW":    return "WORKSPACE_OBJECT";
    case "BRIDGE_LATER":  return "SCHEDULER_TOOL";
    case "RISKY":         return "CODE_SANDBOX_TEMPLATE";
    case "REFERENCE_ONLY":return "REFERENCE_ONLY";
    case "IGNORE":        return "REFERENCE_ONLY";
  }
}

const PRIORITY_BY_LEVEL: Record<OpenArchitectureAbsorptionLevel, "P0" | "P1" | "P2" | "P3"> = {
  ABSORB_NOW: "P0",
  AGENT_TOOL: "P1",
  STORE_PACKAGE: "P1",
  BRIDGE_LATER: "P2",
  RISKY: "P2",
  REFERENCE_ONLY: "P3",
  IGNORE: "P3",
};

export function buildBridgePlan(analysis: OpenArchitectureAnalysis): OpenArchitectureBridgePlan {
  const bridgeType = decideBridgeType(analysis.absorptionLevel);
  const targets = Array.from(new Set(analysis.modules.flatMap((m) => m.mappableToAether)));
  const steps: string[] = [
    "登记 OpenArchitectureSource 并保存到 Workspace",
    "运行 Analyzer 抽取模块 / 能力 / 风险",
    `按映射规则接入：${targets.slice(0, 5).join("、") || "—"}`,
  ];
  if (bridgeType === "WEBXXM_PACKAGE") steps.push("生成 WebXXM 能力包草案，等待发布审核");
  if (bridgeType === "SEQUENCE_AGENT_TOOL") steps.push("注册为数列 Agent 可调用工具（默认低权限）");
  if (bridgeType === "SCHEDULER_TOOL") steps.push("生成 Scheduler 任务草案，高风险步骤 WAITING_CONFIRMATION");
  if (bridgeType === "CODE_SANDBOX_TEMPLATE") steps.push("生成 Code Sandbox / Local Gateway 模板，禁止默认放行");
  steps.push("写入 Sequence Memory / MSL / Sequence Currency / Record Center");
  steps.push("等待用户在 /system/open-architecture 中确认落地");

  const requiredPermissions: string[] = [];
  if (bridgeType === "WEBXXM_PACKAGE") requiredPermissions.push("商店发布", "包安装", "用户授权");
  if (bridgeType === "SEQUENCE_AGENT_TOOL") requiredPermissions.push("Agent 工具调用");
  if (bridgeType === "CODE_SANDBOX_TEMPLATE") requiredPermissions.push("代码执行（沙盒）");
  if (bridgeType === "LOCAL_GATEWAY_PLUGIN") requiredPermissions.push("本机进程 / 文件访问");

  return {
    id: nextOaId("OABP"),
    analysisId: analysis.id,
    targetSystems: targets,
    bridgeType,
    steps,
    requiredPermissions,
    risks: analysis.risks,
    recommendedPriority: PRIORITY_BY_LEVEL[analysis.absorptionLevel],
    lovablePromptDraft: buildLovablePromptDraft(analysis, bridgeType, targets),
  };
}

function buildLovablePromptDraft(
  analysis: OpenArchitectureAnalysis,
  bridgeType: OpenArchitectureBridgeType,
  targets: string[],
): string {
  return [
    `请把开源项目「${analysis.projectType}」按以下方案吸收到 Aetherworld：`,
    `- 吸收等级：${analysis.absorptionLevel}`,
    `- 桥接类型：${bridgeType}`,
    `- 接入系统：${targets.join("、") || "—"}`,
    `- 模块：${analysis.modules.map((m) => m.name).join("、") || "—"}`,
    `- 风险：${analysis.risks.slice(0, 3).join("；") || "—"}`,
    `禁止：自动执行代码、自动安装依赖、自动复制源码、绕过 license。`,
  ].join("\n");
}

// WebXXM 包草案
export function buildWebXXMPackageDraft(analysis: OpenArchitectureAnalysis): WebXXMPackageDraft | undefined {
  if (analysis.absorptionLevel !== "STORE_PACKAGE") return undefined;
  const primaryCap = analysis.capabilities[0];
  return {
    packageName: `oa-${analysis.projectType.toLowerCase().replace(/\s+/g, "-")}-${analysis.id.slice(-6)}`,
    capabilityType: primaryCap?.capabilityType ?? "PLUGIN",
    permissions: ["package.install", "package.invoke"],
    inputSchema: "{ input: string }",
    outputSchema: "{ output: string, meta: object }",
    riskLevel: primaryCap?.riskLevel ?? "MEDIUM",
    installRequirements: analysis.dependencies.slice(0, 10),
    usageExamples: [
      `在 /store 安装「${analysis.projectType}」能力包`,
      `数列 Agent 调用工具：${primaryCap?.name ?? "（待定）"}`,
    ],
  };
}
