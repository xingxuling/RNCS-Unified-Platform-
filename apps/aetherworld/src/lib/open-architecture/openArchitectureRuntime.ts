// 开源架构吸收 · 主运行时（Scanner + Analyzer + Mapper + BridgePlanner + Safety 编排）
// 所有内部桥接点（Workspace / Memory / Currency / MSL / Scheduler / Agent / SequenceAI / Record / Store）
// 在此聚合调用：当对应模块可用时实际写入，否则只生成草案与日志。

import type {
  OpenArchitectureSource,
  OpenArchitectureAnalysis,
  OpenArchitectureBridgePlan,
  WebXXMPackageDraft,
} from "./openArchitectureTypes";
import {
  scanOpenArchitecture,
  extractModules,
  extractCapabilities,
  analyzeRisks,
  extractFlows,
  extractSecurityBoundaries,
  nextOaId,
} from "./openArchitectureAnalyzer";
import {
  applyAetherMapping,
  decideAbsorptionLevel,
  buildBridgePlan,
  buildWebXXMPackageDraft,
} from "./openArchitectureAetherMapper";
import { safetyHeaderForAnalysis } from "./openArchitectureSafetyPolicy";

export interface AbsorbResult {
  source: OpenArchitectureSource;
  analysis: OpenArchitectureAnalysis;
  bridgePlan: OpenArchitectureBridgePlan;
  webxxmDraft?: WebXXMPackageDraft;
  warnings: string[];
}

// ===== 主入口 =====

export function createSource(input: Partial<OpenArchitectureSource> & { title: string }): OpenArchitectureSource {
  return {
    id: nextOaId("OAS"),
    sourceType: input.sourceType ?? "MANUAL_DESCRIPTION",
    title: input.title,
    url: input.url,
    rawText: input.rawText,
    fileTree: input.fileTree,
    languageHints: input.languageHints ?? [],
    createdAt: new Date().toISOString(),
  };
}

export function absorbOpenArchitecture(source: OpenArchitectureSource): AbsorbResult {
  const signals = scanOpenArchitecture(source);
  const modules = applyAetherMapping(extractModules(source));
  const capabilities = extractCapabilities(source, modules);
  const risks = analyzeRisks(source, signals, modules);
  const flows = extractFlows(source);
  const securityBoundaries = extractSecurityBoundaries(source);

  const projectType = guessProjectType(signals, modules);

  const partial: Omit<OpenArchitectureAnalysis, "absorptionLevel"> = {
    id: nextOaId("OAA"),
    sourceId: source.id,
    projectType,
    techStack: signals.techStack,
    architecturePattern: signals.architecturePattern,
    modules,
    capabilities,
    dataFlow: flows.dataFlow,
    uiFlow: flows.uiFlow,
    runtimeFlow: flows.runtimeFlow,
    securityBoundaries,
    dependencies: signals.dependencies,
    risks,
    createdAt: new Date().toISOString(),
  };
  const absorptionLevel = decideAbsorptionLevel(partial);
  const analysis: OpenArchitectureAnalysis = { ...partial, absorptionLevel };
  const bridgePlan = buildBridgePlan(analysis);
  const webxxmDraft = buildWebXXMPackageDraft(analysis);

  // 内部桥接点（容错调用）
  bridgeAll({ source, analysis, bridgePlan, webxxmDraft }).catch((e) => {
    // eslint-disable-next-line no-console
    console.warn("[open-arch] 内部桥接调用部分失败：", e);
  });

  return {
    source,
    analysis,
    bridgePlan,
    webxxmDraft,
    warnings: safetyHeaderForAnalysis(),
  };
}

function guessProjectType(signals: { techStack: string[]; architecturePattern: string[] }, modules: { layer: string }[]): string {
  if (modules.some((m) => m.layer === "AGENT")) return "Agent 框架";
  if (modules.some((m) => m.layer === "PLUGIN")) return "插件化平台";
  if (modules.some((m) => m.layer === "WORKFLOW")) return "工作流引擎";
  if (signals.techStack.includes("LLM 框架")) return "LLM 应用框架";
  if (signals.techStack.includes("桌面 / 客户端壳")) return "桌面 / 本机应用";
  if (signals.techStack.includes("React") || signals.techStack.includes("Vue")) return "前端应用";
  if (signals.techStack.includes("Node 服务端")) return "Node 服务端";
  return "通用开源项目";
}

// ===== 内部桥接（容错；模块不可用时仅记录） =====

interface BridgeInput {
  source: OpenArchitectureSource;
  analysis: OpenArchitectureAnalysis;
  bridgePlan: OpenArchitectureBridgePlan;
  webxxmDraft?: WebXXMPackageDraft;
}

async function bridgeAll(b: BridgeInput) {
  await Promise.allSettled([
    bridgeRecord(b),
    bridgeMemory(b),
    bridgeMsl(b),
    bridgeCurrency(b),
    bridgeWorkspace(b),
    bridgeScheduler(b),
    bridgeAgent(b),
    bridgeSequenceAi(b),
    bridgeStore(b),
  ]);
}

async function bridgeRecord({ source, analysis, bridgePlan }: BridgeInput) {
  try {
    const mod: any = await import("@/lib/record-center/recordCenterRuntime");
    if (typeof mod.recordChatTurn === "function") {
      // 复用 recordChatTurn 作为通用事件入口
      mod.recordChatTurn({
        sessionId: "open-architecture",
        messageId: analysis.id,
        question: `[OA] 吸收：${source.title}`,
        answerPreview: `${analysis.projectType} / ${analysis.absorptionLevel} → ${bridgePlan.bridgeType}`,
        source: "PROVIDER",
        qaStatus: "PASS",
      });
    }
  } catch {/* 模块缺失：忽略 */}
}

async function bridgeMemory({ source, analysis }: BridgeInput) {
  try {
    const mod: any = await import("@/lib/sequence-memory/sequenceMemoryCompressor");
    if (typeof mod.compressChatTurnToSequenceMemory === "function") {
      mod.compressChatTurnToSequenceMemory({
        sessionId: "open-architecture",
        userInput: `开源架构吸收：${source.title}`,
        assistantOutput: JSON.stringify({
          projectType: analysis.projectType,
          level: analysis.absorptionLevel,
          modules: analysis.modules.map((m) => m.name),
        }),
        tags: ["OPEN_ARCH_ABSORB", `SMU-ARCH-ABSORB-${analysis.id.slice(-6)}-v1`],
      });
    }
  } catch {/* 忽略 */}
}

async function bridgeMsl({ analysis }: BridgeInput) {
  try {
    const mod: any = await import("@/lib/msl-state/mslChatBridge");
    if (typeof mod.buildChatMslFrames === "function") {
      // 仅生成；不强制持久化
      mod.buildChatMslFrames?.({
        kind: "OPEN_ARCHITECTURE_ABSORPTION",
        absorptionLevel: analysis.absorptionLevel,
        analysisId: analysis.id,
      });
    }
  } catch {/* 忽略 */}
}

async function bridgeCurrency({ analysis }: BridgeInput) {
  try {
    const mod: any = await import("@/lib/sequence-currency/sequenceCurrencyChatBridge");
    if (typeof mod.recordChatRunCurrencyEvent === "function") {
      mod.recordChatRunCurrencyEvent({
        sessionId: "open-architecture",
        eventType: "OPEN_ARCH_ABSORB",
        meta: { analysisId: analysis.id, level: analysis.absorptionLevel },
      });
    }
  } catch {/* 忽略 */}
}

async function bridgeWorkspace({ source, analysis, bridgePlan }: BridgeInput) {
  try {
    // 优先调用 workspace 对象创建器（若存在）
    const candidates = [
      "@/lib/workspace/workspaceObjectRuntime",
      "@/lib/workspace/aetherWorkspaceRuntime",
    ];
    for (const path of candidates) {
      try {
        const mod: any = await import(/* @vite-ignore */ path);
        const fn = mod.createWorkspaceObject || mod.upsertWorkspaceObject;
        if (typeof fn === "function") {
          fn({
            objectType: "OPEN_ARCHITECTURE_ANALYSIS",
            id: analysis.id,
            title: source.title,
            payload: { source, analysis, bridgePlan },
            generatedAt: new Date().toISOString(),
          });
          return;
        }
      } catch { /* 继续下一个 */ }
    }
  } catch {/* 忽略 */}
}

async function bridgeScheduler({ source, analysis, bridgePlan }: BridgeInput) {
  try {
    const mod: any = await import("@/lib/scheduler/aetherSchedulerChatBridge");
    const fn = mod.maybeCreateChatTask || mod.createSchedulerTask;
    if (typeof fn === "function") {
      fn({
        taskType: "OPEN_ARCHITECTURE_ABSORB",
        title: `吸收：${source.title}`,
        priority: bridgePlan.recommendedPriority,
        steps: bridgePlan.steps,
        waitingConfirmationFor: bridgePlan.risks.length > 0 ? bridgePlan.risks : undefined,
        meta: { analysisId: analysis.id, bridgeType: bridgePlan.bridgeType },
      });
    }
  } catch {/* 忽略 */}
}

async function bridgeAgent({ analysis }: BridgeInput) {
  // 预留：把分析任务派给 Architect / Code / Security / Product / QA Agent。
  // 仅在 Sequence Agent Runtime 支持外部任务派发时启用。
  try {
    const mod: any = await import("@/lib/sequence-agent/sequenceAgentCoordinator");
    if (typeof mod.dispatchExternalReview === "function") {
      mod.dispatchExternalReview({
        topic: "OPEN_ARCHITECTURE_ABSORPTION",
        analysisId: analysis.id,
        agents: ["ARCHITECT_AGENT", "CODE_AGENT", "SECURITY_AGENT", "PRODUCT_AGENT", "QA_AGENT"],
      });
    }
  } catch {/* 忽略 */}
}

async function bridgeSequenceAi({ analysis }: BridgeInput) {
  // 预留 ABSORB_OPEN_ARCHITECTURE 模式（若 Sequence AI 模式表已扩展则注册）。
  try {
    const mod: any = await import("@/lib/sequence-ai/sequenceAiModuleRegistry");
    if (typeof mod.registerModeUsage === "function") {
      mod.registerModeUsage("ABSORB_OPEN_ARCHITECTURE", { analysisId: analysis.id });
    }
  } catch {/* 忽略 */}
}

async function bridgeStore({ webxxmDraft }: BridgeInput) {
  if (!webxxmDraft) return;
  // 仅生成草案，不安装。预留 store packager 接入点（动态路径以避开静态解析）。
  try {
    const path = "@/lib/store/webxxmDraftRuntime";
    const mod: any = await import(/* @vite-ignore */ path);
    if (typeof mod.registerPackageDraft === "function") {
      mod.registerPackageDraft(webxxmDraft);
    }
  } catch {/* 忽略 */}
}

// ===== 计算法标签（用于 Chat 路由）=====
export const OPEN_ARCHITECTURE_ABSORPTION_CALCULUS = "OPEN_ARCHITECTURE_ABSORPTION_CALCULUS";
