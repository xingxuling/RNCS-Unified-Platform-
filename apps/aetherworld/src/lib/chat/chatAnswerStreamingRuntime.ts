// ANSWER_ONLY / AUTO-ASK 流式回答运行时
// 顺序：真实 LLM Provider（Ollama / OpenAI-Compat）→ 真实 WebLLM → 规则回答
// 不绕过 QA / Safety / Secret Guard / Session 持久化。
import { runChatQa } from "./chatQaBridge";
import { resolveChatIntent, type ChatIntentResult } from "./chatIntentResolver";
import { buildSuggestedActions } from "./chatSuggestedActionEngine";
import { newMessageId, type ChatMessage } from "./chatMessageEngine";
import { appendMessage, updateMessage } from "./chatSessionEngine";
import {
  runRealWebLlmChat,
  getRealWebLlmRuntimeState,
  stopRealWebLlmGeneration,
} from "@/lib/real-webllm/aetherRealWebLlmRuntime";
import { resolveChatProvider } from "./chatProviderResolver";
import { runLlmChat } from "@/lib/llm-providers/llmProviderRuntime";
import {
  resolvePromptMode,
  buildSystemPrompt,
  PROMPT_MODE_LABEL,
} from "./chatPromptModeRouter";
import { routeCalculus } from "./calculusChatRouter";
import {
  buildContractFromRoute,
  contractToSystemPrompt,
} from "./calculusPromptContractBuilder";
import { buildConstantsConstraintPrompt } from "./constantsPromptConstraintBridge";
import { detectConstantsDrift } from "./constantsDriftDetector";
import {
  parseToolCalls,
  executeToolCalls,
  stripToolBlocks,
} from "./chatToolCallingRuntime";
import { buildFingerprint } from "./sequenceChatFingerprintBridge";
import { buildCalculusFallbackAnswer } from "./calculusFallbackAnswerBuilder";
import {
  notifyCalculusRouted,
  notifyDrift,
  notifyToolResults,
  notifyCalculusFallback,
  notifyFingerprint,
} from "./chatCalculusNoticeBridge";
import { CALCULUS_LABEL, type ChatCalculusInfo } from "./calculusRouteResultTypes";
import { runFusionPlanning } from "@/lib/fusion/fusionRuntime";
import { buildCalculusChainFallbackAnswer } from "@/lib/fusion/calculusChainFallbackBuilder";
import { buildCompressedChatContext } from "@/lib/sequence-memory/sequenceMemoryChatBridge";
import { compressChatTurnToSequenceMemory } from "@/lib/sequence-memory/sequenceMemoryCompressor";
import type { ChatMemorySummary } from "@/lib/sequence-memory/sequenceMemoryTypes";
import {
  recordChatRunCurrencyEvent,
  estimateTokens,
} from "@/lib/sequence-currency/sequenceCurrencyChatBridge";
import { recordMemoryCompressionCurrencyEvent } from "@/lib/sequence-currency/sequenceCurrencyMemoryBridge";
import { buildChatMslFrames } from "@/lib/msl-state/mslChatBridge";
import { runSequencePrediction, isPredictionIntent } from "@/lib/sequence-prediction/sequencePredictionEngine";
import {
  maybeCreateChatTask,
  buildChatSchedulerSummary,
  type ChatSchedulerSummary,
} from "@/lib/scheduler/aetherSchedulerChatBridge";
import { buildChatLegacyInfo } from "@/lib/legacy-modules/legacyModuleChatBridge";
import { buildChatManualInfo } from "@/lib/system/aetherSystemManual";
import { buildChatAgentInfo } from "@/lib/sequence-agent/sequenceAgentChatBridge";
import { buildChatSequenceAiInfo } from "@/lib/sequence-ai/sequenceAiChatBridge";
import {
  recordChatTurn,
  recordModelCall,
  recordFusionPlan,
  recordMemoryUnit,
  recordCurrencyEvent,
  recordMslFrame,
  recordPrediction,
  recordSchedulerTask,
} from "@/lib/record-center/recordCenterRuntime";
import { buildChatRecordCenterInfo } from "@/lib/record-center/recordCenterChatBridge";
import { buildChatOpenArchInfo } from "@/lib/open-architecture/openArchitectureChatBridge";
import { buildChatNetworkInfo } from "@/lib/network/aetherNetworkChatBridge";
import { buildChatProjectFusionInfo } from "@/lib/project-fusion/projectFusionChatBridge";
import { buildChatImaginativeFusionInfo } from "@/lib/imaginative-fusion/imaginativeFusionChatBridge";
import { buildChatLayerAuditInfo } from "@/lib/layer-audit/layerAuditChatBridge";
import { buildChatPersonalModelForgeInfo } from "@/lib/personal-model-forge/personalModelForgeChatBridge";
import { buildChatIntakeForgeInfo } from "@/lib/intake-forge/intakeForgeChatBridge";
import { buildChatDatasetInfo } from "@/lib/aetherseed-dataset/datasetChatBridge";
import { buildChatTrainingFactoryCalculusInfo } from "@/lib/training-factory/trainingFactoryChatBridge";
import { buildChatCapabilityAssetInfo } from "@/lib/capability-assets/capabilityAssetChatBridge";
import { buildChatLocalTrainingInfo } from "@/lib/aetherseed-local-training/localTrainingChatBridge";
import { buildChatExperimentLedgerInfo } from "@/lib/aetherseed-experiment-ledger/experimentChatBridge";
import { buildWorkflowChatInfo } from "@/lib/aetherseed-training-workflow/trainingWorkflowChatBridge";
import { buildChatAutoTrainingInfo } from "@/lib/aetherseed-auto-training/autoTrainingChatBridge";
import { buildChatLocalGatewayInfo } from "@/lib/local-execution-gateway/localGatewayChatBridge";
import { buildChatFirstRunInfo } from "@/lib/aetherseed-first-run/firstRunChatBridge";
import { buildChatUserAssetInfo } from "@/lib/user-asset-upload/userAssetChatBridge";


export interface StreamingAnswerOptions {
  sessionId: string;
}

export interface StreamingAnswerHandle {
  userMessage: ChatMessage;
  assistantMessageId: string;
  /** 仅在使用 WebLLM 时有效 */
  stop: () => void;
  /** 完成 Promise，便于 caller await busy 结束 */
  done: Promise<void>;
}

function answerTitle(intent: ChatIntentResult): string {
  switch (intent.intentType) {
    case "ASK_COMPARISON": return "对比说明";
    case "ASK_DIAGNOSIS": return "诊断与原因";
    case "ASK_HOW_TO": return "操作步骤";
    case "ASK_ANALYSIS": return "分析与判断";
    case "ASK_STRATEGY": return "策略建议";
    case "ASK_CAPABILITY": return "能力说明";
    case "ASK_SYSTEM_STATUS": return "系统状态";
    case "ASK_TO_DO_PLANNING": return "下一步规划";
    case "ASK_TO_DO_FEASIBILITY": return "可行性判断";
    case "ASK_TO_DO_RECOMMENDATION": return "方案推荐";
    default: return "回答";
  }
}

function ruleBasedAnswer(raw: string, intent: ChatIntentResult): string {
  return [
    `针对你的提问，先给出规则模式的判断（仅供参考，不替代计算法 / 常数 / QA 的裁决）。`,
    ``,
    `· 输入识别：${intent.intentType}（${intent.inputMode}）`,
    `· 判断依据：${intent.rationale}`,
    ``,
    raw.length > 80
      ? `我理解你希望我围绕这段问题展开解释，并在需要时给出可执行选项。`
      : `我理解你的问题是「${raw}」。`,
    ``,
    `如需进一步落地，请使用下方按钮选择「继续展开 / 生成方案 / 创建对象 / 打开相关页面」。`,
  ].join("\n");
}

/**
 * 提交一次 ANSWER_ONLY 流式回答。
 * - QA 阻断 → 返回阻断消息，不进入 WebLLM。
 * - WebLLM 就绪 → 使用 runRealWebLlmChat 流式输出。
 * - WebLLM 不可用 / 失败 → 自动降级到规则回答。
 */
export function startAnswerOnlyStreaming(
  raw: string,
  opts: StreamingAnswerOptions,
): StreamingAnswerHandle {
  const sessionId = opts.sessionId;
  const now = new Date().toISOString();

  const userMessage: ChatMessage = {
    id: newMessageId(),
    type: "USER_MESSAGE",
    role: "user",
    text: raw,
    createdAt: now,
  };
  appendMessage(sessionId, userMessage);

  // 1. QA / Safety —— 不绕过
  const safety = runChatQa(raw);
  if (safety.status === "BLOCK") {
    const blocked: ChatMessage = {
      id: newMessageId(),
      type: "ERROR_BLOCKED",
      role: "assistant",
      text: "该指令被 QA 阻断。",
      blockedReasons: safety.reasons,
      qaInfo: { status: "BLOCK", reasons: safety.reasons },
      createdAt: new Date().toISOString(),
      suggestedActions: [{ type: "OPEN_PAGE", label: "查看 QA 规则", route: "/system-audit" }],
    };
    appendMessage(sessionId, blocked);
    return {
      userMessage,
      assistantMessageId: blocked.id,
      stop: () => {},
      done: Promise.resolve(),
    };
  }

  const intent = resolveChatIntent(raw);
  const assistantId = newMessageId();
  const title = answerTitle(intent);

  // 占位消息：先以未知来源出现，随后由 Provider / WebLLM / Rule 路径覆盖
  const placeholder: ChatMessage = {
    id: assistantId,
    type: "ANSWER_CARD",
    role: "assistant",
    answerCard: { title, answer: "" },
    intent,
    createdAt: new Date().toISOString(),
    suggestedActions: buildSuggestedActions(intent, {}),
    streaming: true,
    slowHint: "正在连接模型……本地模型首次生成可能较慢。",
  };
  appendMessage(sessionId, placeholder);

  // 慢速提示定时器（0-5s / 15s / 45s / 60s 分级）
  const slowTimers: number[] = [];
  const armSlowTimers = () => {
    slowTimers.push(
      window.setTimeout(() => {
        updateMessage(sessionId, assistantId, {
          slowHint: "正在调用本地模型……",
        });
      }, 0),
      window.setTimeout(() => {
        updateMessage(sessionId, assistantId, {
          slowHint: "本地模型仍在生成，请稍候……",
        });
      }, 15000),
      window.setTimeout(() => {
        updateMessage(sessionId, assistantId, {
          slowHint: "本地模型响应较慢，你可以继续等待或切换规则模式。",
        });
      }, 45000),
      window.setTimeout(() => {
        updateMessage(sessionId, assistantId, {
          slowHint:
            "本地模型响应较慢，可继续等待 · 使用规则模式重答 · 打开模型设置",
        });
      }, 60000),
    );
  };
  const clearSlowTimers = () => {
    slowTimers.forEach((t) => window.clearTimeout(t));
    slowTimers.length = 0;
  };

  // 当前是否仍在 Provider / WebLLM 阶段（用于 stop 路由）
  let stage: "PROVIDER" | "WEBLLM" | "DONE" = "PROVIDER";

  const done = (async () => {
    armSlowTimers();

    // ===== 0. 计算法路由 + Contract + 常数约束 + 融合规划 =====
    const calcRoute = routeCalculus(raw);
    const contract = buildContractFromRoute(calcRoute);
    if (calcRoute.calculusIds.length) notifyCalculusRouted(calcRoute);

    // 融合层：五域 / 引擎权重 / 概念图 / 计算法链 / 常数宇宙
    const fusion = runFusionPlanning(raw, calcRoute);
    const buildFusionFallback = () =>
      buildCalculusChainFallbackAnswer({
        raw,
        chain: fusion.info.chain,
        fiveDomain: fusion.info.fiveDomain,
        conceptGraph: fusion.info.conceptGraph,
        engineSummary: fusion.info.engineProfile,
      });

    const calcInfoBase: ChatCalculusInfo | undefined = contract
      ? { route: calcRoute, contract }
      : undefined;
    updateMessage(sessionId, assistantId, {
      calculusInfo: calcInfoBase,
      fusionInfo: fusion.info,
    });

    // ===== 1. 优先尝试真实 LLM Provider =====
    const promptMode = resolvePromptMode(raw, intent);
    const baseSystemPrompt = buildSystemPrompt(promptMode);

    // 数列记忆压缩上下文：最近原文 + 检索摘要
    const compressedCtx = buildCompressedChatContext({
      sessionId,
      raw,
      fusion: fusion.info,
      route: calcRoute,
      isLightAnswer: promptMode === "LIGHT_ANSWER",
      explicitContinue: /(继续|接着|继续刚才|刚才|上一轮)/.test(raw),
    });

    const systemPrompt = [
      baseSystemPrompt,
      contract ? "\n" + contractToSystemPrompt(contract) : "",
      contract ? "\n" + buildConstantsConstraintPrompt(contract) : "",
      "\n" + fusion.fusionSystemPromptAddendum,
      compressedCtx.memoryPromptText ? "\n" + compressedCtx.memoryPromptText : "",
    ].join("\n");

    // 历史消息：仅注入最近 N 轮原文（不再注入全部）
    const historyMessages = compressedCtx.recentTurns
      .filter((t) => t.role !== "system")
      .map((t) => ({ role: t.role as "user" | "assistant", content: t.content }));

    try {
      const decision = await resolveChatProvider();
      if (decision.canUseProvider && decision.provider) {
        const start = performance.now();
        let streamed = "";
        const result = await runLlmChat({
          providerId: decision.provider.providerId,
          sourceModule: "AetherChat",
          taskType: `CHAT_ANSWER_${promptMode}`,
          temperature: 0.7,
          // 轻量问答减小 token 上限，进一步提速
          maxTokens: promptMode === "LIGHT_ANSWER" ? 512 : 1024,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...historyMessages,
            { role: "user", content: raw },
          ],
          handlers: {
            onDelta: (delta: string) => {
              streamed += delta;
              updateMessage(sessionId, assistantId, {
                answerCard: { title, answer: streamed },
              });
            },
          },
        });
        const latencyMs = Math.round(performance.now() - start);

        if (result.status === "SUCCESS" && (result.text || streamed)) {
          clearSlowTimers();
          stage = "DONE";

          const rawText = result.text || streamed;
          // 工具调用解析 + 权限 + 执行
          const toolCalls = parseToolCalls(rawText);
          const toolResults = toolCalls.length ? await executeToolCalls(toolCalls) : [];
          if (toolResults.length) notifyToolResults(toolResults);
          const visibleText = stripToolBlocks(rawText);

          // 常数漂移
          const drift = detectConstantsDrift(visibleText);
          if (drift.severity !== "NONE") notifyDrift(drift);

          // 语义指纹
          const fp = calcInfoBase
            ? buildFingerprint({
                messageId: assistantId,
                text: visibleText,
                domain: calcInfoBase.contract.domain,
                calculusIds: calcInfoBase.contract.calculusIds,
                outputType: calcInfoBase.contract.allowedOutputTypes[0] ?? "TEXT",
              })
            : undefined;
          if (fp) notifyFingerprint(fp.sequenceCode);

          // 数列记忆压缩（失败不阻断）
          let memoryInfo: ChatMemorySummary | undefined;
          try {
            const comp = compressChatTurnToSequenceMemory({
              chatSessionId: sessionId,
              userMessageId: userMessage.id,
              assistantMessageId: assistantId,
              userText: raw,
              assistantText: visibleText,
              fusionInfo: { ...fusion.info, drift },
              route: calcRoute,
              domain: contract?.domain,
              outputType: contract?.allowedOutputTypes[0] ?? "TEXT",
              safetyNotes: result.safetyNotes,
            });
            memoryInfo = {
              created: comp.createdUnits.length > 0,
              unitCount: comp.createdUnits.length,
              sequenceCodes: comp.createdUnits.map((u) => u.sequenceCode),
              compressionRatio: comp.compressionRatio,
              injectedMemoryCount: compressedCtx.metrics.injectedMemoryCount,
              safetyStatus: comp.createdUnits[0]?.safetyStatus ?? "PASS",
              notes: [...compressedCtx.safetyNotes, ...comp.safetyNotes],
            };
          } catch (e: any) {
            memoryInfo = {
              created: false,
              unitCount: 0,
              sequenceCodes: [],
              compressionRatio: 0,
              injectedMemoryCount: compressedCtx.metrics.injectedMemoryCount,
              safetyStatus: "PASS",
              notes: ["数列记忆压缩失败，本轮已使用普通上下文。"],
            };
          }

          // 数列货币 / 价值账本：把本次模型调用接入既有系统（不重新发明账本）
          let currencyInfo;
          try {
            currencyInfo = recordChatRunCurrencyEvent({
              chatSessionId: sessionId,
              messageId: assistantId,
              userMessageId: userMessage.id,
              providerId: result.providerId,
              providerName: decision.provider.chineseName,
              modelId: result.modelId,
              latencyMs,
              tokenEstimate: estimateTokens(raw) + estimateTokens(visibleText),
              promptMode,
              calculusRoute: calcRoute,
              fusion: { ...fusion.info, drift },
              safetyStatus: result.qaStatus === "BLOCKED" ? "BLOCK" : result.qaStatus === "WARN" ? "WARN" : "PASS",
              outputType: contract?.allowedOutputTypes[0] ?? "TEXT",
              rawInput: raw,
            });
            if (memoryInfo) {
              recordMemoryCompressionCurrencyEvent({
                chatSessionId: sessionId,
                messageId: assistantId,
                memory: memoryInfo,
              });
            }
          } catch (e) {
            // 数列货币写入失败不阻断 Chat
            // eslint-disable-next-line no-console
            console.warn("[chat] 数列货币写入失败：", e);
          }

          // MSL 数列状态语言：本轮帧（CHAT_TURN / FUSION_PLAN / 记忆 / 货币引用）
          let mslInfo;
          try {
            const safety: "PASS" | "WARN" | "BLOCK" =
              result.qaStatus === "BLOCKED" ? "BLOCK"
              : result.qaStatus === "WARN" ? "WARN" : "PASS";
            mslInfo = buildChatMslFrames({
              chatSessionId: sessionId,
              messageId: assistantId,
              source: "PROVIDER",
              providerId: result.providerId,
              modelId: result.modelId,
              promptMode,
              fusion: { ...fusion.info, drift },
              calculusRoute: calcRoute,
              outputType: contract?.allowedOutputTypes[0] ?? "TEXT",
              safetyStatus: safety,
              qaStatus: result.qaStatus,
              memoryUnitId: memoryInfo?.sequenceCodes?.[0],
              memoryCompressionRatio: memoryInfo?.compressionRatio,
              valueEventId: currencyInfo?.ledgerEntryIds?.[0],
            });
          } catch (e) {
            // MSL 失败不阻断 Chat
            // eslint-disable-next-line no-console
            console.warn("[chat] MSL 状态帧生成失败：", e);
          }

          // 数列预测：命中 SEQUENCE_PREDICTION_CALCULUS 或意图触发器时生成
          let predictionInfo;
          try {
            if (
              calcRoute.primaryCalculusId === "SEQUENCE_PREDICTION_CALCULUS" ||
              isPredictionIntent(raw)
            ) {
              predictionInfo = runSequencePrediction({
                rawInput: raw,
                fusion: { ...fusion.info, drift },
                memoryUnitCount: memoryInfo?.injectedMemoryCount,
                mslFrameCount: mslInfo?.frames.length,
                valueEventCount: currencyInfo?.ledgerEntryIds?.length,
              });
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 数列预测生成失败：", e);
          }

          // Aether Scheduler：根据用户输入识别可创建的调度任务（不真实执行外部命令）
          let schedulerInfo: ChatSchedulerSummary | undefined;
          try {
            const trig = maybeCreateChatTask({
              rawInput: raw,
              chatMessageId: assistantId,
              predictionInfoId: predictionInfo?.id,
              mslFrameId: mslInfo?.frames?.[0]?.id,
              currencyEventId: currencyInfo?.ledgerEntryIds?.[0],
            });
            if (trig.triggered) {
              schedulerInfo = buildChatSchedulerSummary(trig.tasks);
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 调度任务创建失败：", e);
          }

          // 旧模块查询：识别用户咨询历史模块状态 / 接入建议
          let legacyInfo: ReturnType<typeof buildChatLegacyInfo>;
          try {
            legacyInfo = buildChatLegacyInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 旧模块查询失败：", e);
          }

          // 数列 Agent：路由 + 多 Agent 评审 / 串行 / 单 Agent
          let agentInfo: ReturnType<typeof buildChatAgentInfo>;
          try {
            agentInfo = buildChatAgentInfo({
              rawInput: raw,
              chatSessionId: sessionId,
              calculusId: calcRoute.primaryCalculusId,
              isPrediction: !!predictionInfo,
              predictionRiskLevel: predictionInfo?.safetyStatus,
              memoryUnitCount: memoryInfo?.injectedMemoryCount,
              currencyEventId: currencyInfo?.ledgerEntryIds?.[0],
              mslFrameId: mslInfo?.frames?.[0]?.id,
            });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 数列 Agent 路由失败：", e);
          }

          // 数列 AI 总调度内核：命中触发词时编排模块执行计划
          let sequenceAiInfo: ReturnType<typeof buildChatSequenceAiInfo>;
          try {
            sequenceAiInfo = buildChatSequenceAiInfo({
              rawInput: raw,
              memoryUnitCount: memoryInfo?.injectedMemoryCount,
              valueEventCount: currencyInfo?.ledgerEntryIds?.length,
              mslFrameId: mslInfo?.frames?.[0]?.id,
            });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 数列 AI 调度失败：", e);
          }

          // 总说明书引导：识别用户对系统总览 / 模块 / 路线图的查询
          let manualInfo: ReturnType<typeof buildChatManualInfo>;
          try {
            manualInfo = buildChatManualInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 总说明书匹配失败：", e);
          }

          // 记录中心：写入 Chat / Model / Fusion / Memory / Currency / MSL / Prediction / Scheduler 事件
          try {
            recordChatTurn({
              sessionId, messageId: assistantId, question: raw,
              answerPreview: visibleText, source: "PROVIDER", qaStatus: result.qaStatus,
            });
            recordModelCall({
              providerId: result.providerId, providerType: decision.provider.providerType,
              modelId: result.modelId, latencyMs, success: true,
              runId: result.runId, sessionId, messageId: assistantId,
            });
            if (calcInfoBase) {
              recordFusionPlan({
                calculusId: calcRoute.primaryCalculusId,
                drift: typeof drift === "number" ? drift : undefined,
                sessionId,
              });
            }
            if (memoryInfo) {
              recordMemoryUnit({
                injectedCount: memoryInfo.injectedMemoryCount,
                compressionRatio: (memoryInfo as any).compressionRatio, sessionId,
              });
            }
            if (currencyInfo) {
              recordCurrencyEvent({
                currencyEventId: currencyInfo.ledgerEntryIds?.[0],
                count: currencyInfo.ledgerEntryIds?.length, sessionId,
              });
            }
            if (mslInfo?.frames?.[0]) {
              recordMslFrame({
                mslFrameId: mslInfo.frames[0].id,
                frameType: (mslInfo.frames[0] as any).frameType,
                status: "SUCCESS", sessionId,
              });
            }
            if (predictionInfo) {
              recordPrediction({
                riskLevel: predictionInfo.safetyStatus,
                trajectoriesCount: predictionInfo.trajectories?.length, sessionId,
              });
            }
            if (schedulerInfo?.tasks?.length) {
              for (const t of schedulerInfo.tasks) {
                recordSchedulerTask({
                  taskId: (t as any).id, state: (t as any).state,
                  taskType: (t as any).taskType, title: (t as any).title, sessionId,
                });
              }
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 记录中心写入失败：", e);
          }

          // 记录中心 Chat 桥接：用户查询「最近发生了什么」时返回卡片
          let recordInfo: ReturnType<typeof buildChatRecordCenterInfo>;
          try {
            recordInfo = buildChatRecordCenterInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 记录中心查询失败：", e);
          }

          // 开源架构吸收：识别用户意图 → 触发分析 + 桥接计划生成
          let openArchInfo: ReturnType<typeof buildChatOpenArchInfo>;
          try {
            openArchInfo = buildChatOpenArchInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 开源架构吸收分析失败：", e);
          }


          // 受控联网：识别 URL / 联网意图 → 只读读取（异步，失败不阻塞）
          let networkInfo: Awaited<ReturnType<typeof buildChatNetworkInfo>>;
          try {
            networkInfo = await buildChatNetworkInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 联网读取失败：", e);
          }

          // 同账号项目融合：识别意图 → 扫描候选 + 生成 Bridge Plan（不落地高风险）
          let projectFusionInfo: ReturnType<typeof buildChatProjectFusionInfo>;
          try {
            projectFusionInfo = buildChatProjectFusionInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 项目融合分析失败：", e);
          }

          // 畅想式融合：识别脑暴 / 跨项目融合意图
          let imaginativeFusionInfo: ReturnType<typeof buildChatImaginativeFusionInfo>;
          try {
            imaginativeFusionInfo = buildChatImaginativeFusionInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 畅想融合生成失败：", e);
          }

          // 分层审计：识别系统式补法 / 分层缺口 / 哪一层最缺意图
          let layerAuditInfo: ReturnType<typeof buildChatLayerAuditInfo>;
          try {
            layerAuditInfo = buildChatLayerAuditInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 分层审计失败：", e);
          }

          // 个人模型铸造工坊：识别训练 / AetherSeed / 工具链 / 本机 / 服务器训练意图
          let personalModelForgeInfo: ReturnType<typeof buildChatPersonalModelForgeInfo>;
          try {
            personalModelForgeInfo = buildChatPersonalModelForgeInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 个人模型铸造工坊失败：", e);
          }

          // 训练工厂计算法：识别训练工厂 / 数据权重 / 成本 / 下一代意图
          let trainingFactoryCalculusInfo: ReturnType<typeof buildChatTrainingFactoryCalculusInfo>;
          try {
            trainingFactoryCalculusInfo = buildChatTrainingFactoryCalculusInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 训练工厂计算法失败：", e);
          }

          // 投喂式训练数据铸造炉：识别投喂 / 粘贴训练 / 文件夹投喂意图
          let intakeForgeInfo: ReturnType<typeof buildChatIntakeForgeInfo>;
          try {
            intakeForgeInfo = buildChatIntakeForgeInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 投喂铸造炉失败：", e);
          }

          // AetherSeed 数据集：识别数据集 / SFT / 导出 / 评测集意图
          let datasetInfo: ReturnType<typeof buildChatDatasetInfo>;
          try {
            datasetInfo = buildChatDatasetInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 数据集 Chat 桥失败：", e);
          }

          // 能力资产市场：识别内部 / 外部 / 用户能力资产化意图
          let capabilityAssetInfo: ReturnType<typeof buildChatCapabilityAssetInfo>;
          try {
            capabilityAssetInfo = buildChatCapabilityAssetInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 能力资产 Chat 桥失败：", e);
          }

          // AetherSeed 本机训练运行器：识别本机训练 / AetherSeed-XXM / Tiny Model 意图
          let localTrainingInfo: ReturnType<typeof buildChatLocalTrainingInfo>;
          try {
            localTrainingInfo = buildChatLocalTrainingInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 本机训练 Chat 桥失败：", e);
          }

          // AetherSeed 实验账本：识别实验账本 / 失败归因 / checkpoint / 血统线 意图
          let experimentLedgerInfo: ReturnType<typeof buildChatExperimentLedgerInfo>;
          try {
            experimentLedgerInfo = buildChatExperimentLedgerInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 实验账本 Chat 桥失败：", e);
          }

          // AetherSeed Auto Training Executor：识别自动训练 / dry-run / 命令预览 意图
          let autoTrainingInfo: ReturnType<typeof buildChatAutoTrainingInfo>;
          try {
            autoTrainingInfo = buildChatAutoTrainingInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 自动训练 Chat 桥失败：", e);
          }

          // AetherSeed 训练工作流：识别工作流编排意图
          let trainingWorkflowInfo: ReturnType<typeof buildWorkflowChatInfo> = null;
          try {
            trainingWorkflowInfo = buildWorkflowChatInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 训练工作流 Chat 桥失败：", e);
          }

          // Aether Local Execution Gateway：识别本地网关 / 启动方法 / 训练日志 意图
          let localGatewayInfo: ReturnType<typeof buildChatLocalGatewayInfo>;
          try {
            localGatewayInfo = buildChatLocalGatewayInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 本地执行网关 Chat 桥失败：", e);
          }

          // AetherSeed 第一炉训练准备：识别第一炉 / 点火 / 准备状态 意图
          let firstRunInfo: ReturnType<typeof buildChatFirstRunInfo>;
          try {
            firstRunInfo = buildChatFirstRunInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 第一炉训练准备 Chat 桥失败：", e);
          }




          // 用户上传出售：识别上传 / 出售 / 我的资产意图
          let userAssetInfo: ReturnType<typeof buildChatUserAssetInfo>;
          try {
            userAssetInfo = buildChatUserAssetInfo(raw);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[chat] 用户上传出售 Chat 桥失败：", e);
          }



          updateMessage(sessionId, assistantId, {
            streaming: false,
            source: "PROVIDER",
            slowHint: undefined,
            answerCard: { title, answer: visibleText },
            qaInfo:
              result.qaStatus === "PASS"
                ? { status: "PASS", reasons: [] }
                : result.qaStatus === "WARN"
                ? { status: "WARN", reasons: result.safetyNotes }
                : undefined,
            providerInfo: {
              providerId: result.providerId,
              providerType: decision.provider.providerType,
              chineseName: decision.provider.chineseName,
              modelId: result.modelId,
              latencyMs,
              sanitized: result.safetyNotes.some((n) => /脱敏|敏感|sanitize/i.test(n)),
              runId: result.runId,
              promptMode,
              promptModeLabel: PROMPT_MODE_LABEL[promptMode],
            },
            calculusInfo: calcInfoBase
              ? {
                  ...calcInfoBase,
                  drift,
                  fingerprint: fp
                    ? { sequenceCode: fp.sequenceCode, outputType: fp.outputType }
                    : undefined,
                  toolExecutions: toolResults.map((r) => ({
                    toolId: r.toolId,
                    status: r.status,
                    message: r.message,
                  })),
                }
              : undefined,
            fusionInfo: { ...fusion.info, drift },
            memoryInfo,
            currencyInfo,
            mslInfo,
            predictionInfo,
            schedulerInfo,
            legacyInfo,
            agentInfo,
            sequenceAiInfo,
            manualInfo,
            recordInfo,
            openArchInfo,
            networkInfo,
            projectFusionInfo,
            imaginativeFusionInfo,
            layerAuditInfo,
            personalModelForgeInfo,
            trainingFactoryCalculusInfo,
            intakeForgeInfo,
            datasetInfo,
            capabilityAssetInfo,
            localTrainingInfo,
            experimentLedgerInfo,
            autoTrainingInfo,
            trainingWorkflowInfo,
            localGatewayInfo,
            firstRunInfo,
            userAssetInfo,
          });
          return;
        }

        if (result.status === "BLOCKED") {
          clearSlowTimers();
          stage = "DONE";
          const fbText = buildFusionFallback();
          if (calcInfoBase) notifyCalculusFallback();
          updateMessage(sessionId, assistantId, {
            streaming: false,
            source: "FALLBACK",
            slowHint: undefined,
            answerCard: { title, answer: fbText },
            errorText: `模型输出被 QA 阻断：${result.safetyNotes.join("；") || "包含受限内容"}。已切换为${calcInfoBase ? "计算法骨架" : "规则"}回答。`,
          });
          return;
        }


        // 用户强制指定但失败 → 不再尝试 WebLLM，直接 fallback
        if (decision.userForced) {
          clearSlowTimers();
          stage = "DONE";
          const fbText = buildFusionFallback();
          if (calcInfoBase) notifyCalculusFallback();
          updateMessage(sessionId, assistantId, {
            streaming: false,
            source: "FALLBACK",
            slowHint: undefined,
            answerCard: { title, answer: fbText },
            errorText: `「${decision.provider.chineseName}」调用失败：${result.safetyNotes[0] ?? "未知错误"}。已降级到${calcInfoBase ? "计算法骨架" : "规则"}回答。`,
          });
          return;
        }
        // 否则继续尝试 WebLLM
      }
    } catch (e: any) {
      // 忽略 Provider 异常，继续尝试 WebLLM
      // eslint-disable-next-line no-console
      console.warn("[chat] LLM Provider 调用异常，尝试 WebLLM：", e);
    }

    // ===== 2. 尝试真实 WebLLM 流式 =====
    stage = "WEBLLM";
    const rt = getRealWebLlmRuntimeState();
    const canUseWebLlm =
      rt.webGpuSupported &&
      rt.webLlmPackageAvailable &&
      rt.engineStatus === "READY";

    if (!canUseWebLlm) {
      clearSlowTimers();
      stage = "DONE";
      const reason = !rt.webGpuSupported
        ? "当前浏览器不支持 WebGPU"
        : !rt.webLlmPackageAvailable
        ? "WebLLM 包尚未可用"
        : rt.engineStatus === "LOADING"
        ? "本地模型仍在加载中"
        : rt.engineStatus === "ERROR"
        ? `本地模型加载失败：${rt.lastError ?? "未知错误"}`
        : "本地模型尚未就绪";
      updateMessage(sessionId, assistantId, {
        streaming: false,
        source: "FALLBACK",
        slowHint: undefined,
        answerCard: { title, answer: buildFusionFallback() },
        errorText: `${reason}，且未连接到外部模型提供者，已降级到规则回答。`,
      });
      return;
    }

    try {
      updateMessage(sessionId, assistantId, {
        source: "WEBLLM",
        slowHint: "正在使用浏览器本地 WebLLM 生成……",
      });
      const result = await runRealWebLlmChat(
        {
          requestId: assistantId,
          taskType: "CHAT_ANSWER_ONLY",
          sourceModule: "AetherChat",
          stream: true,
          temperature: 0.7,
          maxTokens: 512,
          prompt: {
            userInput: raw,
            systemHint: `这是 Aetherworld 对话界面的 ANSWER_ONLY 模式。请给出清晰、克制、产品化的中文回答。不要绕过 QA、能力包安装机制或系统宪法。不要声称模拟为真实执行。`,
          },
        },
        {
          onDelta: (_chunk, full) => {
            updateMessage(sessionId, assistantId, {
              answerCard: { title, answer: full },
            });
          },
        },
      );

      clearSlowTimers();
      stage = "DONE";

      if (result.status === "BLOCKED") {
        updateMessage(sessionId, assistantId, {
          streaming: false,
          source: "FALLBACK",
          slowHint: undefined,
          realWebLlmRunId: result.runId,
          answerCard: { title, answer: buildFusionFallback() },
          errorText: `WebLLM 输出被 QA 阻断：${result.safetyNotes.join("；") || "包含受限内容"}。已切换为规则回答。`,
        });
        return;
      }

      if (result.status === "FAILED" || result.status === "FALLBACK") {
        updateMessage(sessionId, assistantId, {
          streaming: false,
          source: "FALLBACK",
          slowHint: undefined,
          realWebLlmRunId: result.runId,
          answerCard: { title, answer: buildFusionFallback() },
          errorText: `WebLLM 调用失败：${result.safetyNotes[0] ?? "未知错误"}。已降级到规则回答。`,
        });
        return;
      }

      updateMessage(sessionId, assistantId, {
        streaming: false,
        source: "WEBLLM",
        slowHint: undefined,
        realWebLlmRunId: result.runId,
        answerCard: { title, answer: result.text },
        qaInfo:
          result.qaStatus === "PASS"
            ? { status: "PASS", reasons: [] }
            : result.qaStatus === "WARN"
            ? { status: "WARN", reasons: result.safetyNotes }
            : undefined,
      });
    } catch (e: any) {
      clearSlowTimers();
      stage = "DONE";
      const msg = e?.message ?? String(e);
      updateMessage(sessionId, assistantId, {
        streaming: false,
        source: "FALLBACK",
        slowHint: undefined,
        answerCard: { title, answer: buildFusionFallback() },
        errorText: `WebLLM 运行异常：${msg}。已降级到规则回答。`,
      });
    }
  })();

  return {
    userMessage,
    assistantMessageId: assistantId,
    stop: () => {
      // Provider 阶段暂不支持中止；WebLLM 阶段调用真实 stop
      if (stage === "WEBLLM") stopRealWebLlmGeneration();
    },
    done,
  };
}
