import { resolveChatIntent, type ChatIntentResult } from "./chatIntentResolver";
import { planChatRoute } from "./chatRoutePlanner";
import { checkWebXXMForChat } from "./chatWebXXMBridge";
import { callRuntimeSpine } from "./chatRuntimeSpineBridge";
import { runChatQa } from "./chatQaBridge";
import { buildSuggestedActions } from "./chatSuggestedActionEngine";
import { newMessageId, type ChatMessage } from "./chatMessageEngine";
import { appendMessage, linkObject, linkRun } from "./chatSessionEngine";
import type { WebCapabilityId } from "@/constants/web-capability/webCapabilityTypes";
import { isWebCodeMRelated, classifyWebCodeMTask } from "@/lib/web-codem/webCodeMTaskClassifier";
import { runWebCodeM } from "@/lib/web-codem/webCodeMRuntime";
import { webCodeMResultToDisplayResult } from "./webCodeMResultMapper";
import { wrapResultAsMessage } from "./chatResultPersistenceBridge";


export interface ProcessChatOptions {
  sessionId: string;
  mode?: "AUTO" | "ANSWER_ONLY" | "CREATE_OBJECT" | "RUN_CAPABILITY" | "OPEN_PAGE" | "QA_CHECK" | "FOUNDER";
}

export interface ProcessChatResult {
  userMessage: ChatMessage;
  assistantMessages: ChatMessage[];
  intent: ChatIntentResult;
  navigateTo?: string;
}

export function processChatInput(raw: string, opts: ProcessChatOptions): ProcessChatResult {
  const now = new Date().toISOString();
  const userMessage: ChatMessage = {
    id: newMessageId(),
    type: "USER_MESSAGE",
    role: "user",
    text: raw,
    createdAt: now,
  };
  appendMessage(opts.sessionId, userMessage);

  // 1. QA / Safety
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
    appendMessage(opts.sessionId, blocked);
    return {
      userMessage,
      assistantMessages: [blocked],
      intent: {
        intentType: "GENERAL_CHAT",
        inputMode: "ASK_MODE",
        targetRuntime: "QA",
        confidence: 1,
        rationale: "已阻断",
      },
    };
  }

  // 2. Intent + plan
  const intent = resolveChatIntent(raw);
  const plan = planChatRoute(intent);
  const out: ChatMessage[] = [];
  const effectiveMode = opts.mode ?? "AUTO";

  // 2.5 WebCodeM 单点强化路径：识别为代码 / 应用任务时先检查能力
  if (effectiveMode !== "ANSWER_ONLY" && isWebCodeMRelated(raw)) {
    const cap = checkWebXXMForChat("WEB_CODE_M" as WebCapabilityId);
    if (!cap.callable) {
      const msgType =
        cap.lifecycleStage === "NOT_DOWNLOADED" ? "CAPABILITY_DOWNLOAD_REQUIRED"
        : cap.lifecycleStage === "DOWNLOADED" ? "CAPABILITY_INSTALL_REQUIRED"
        : "CAPABILITY_REQUIRED";
      const msg: ChatMessage = {
        id: newMessageId(),
        type: msgType,
        role: "assistant",
        text: cap.message ?? "需要先启用代码能力 WebCodeM 才能继续。",
        capability: cap,
        intent,
        routeTarget: { route: cap.storeRoute, label: "能力商店" },
        createdAt: new Date().toISOString(),
        suggestedActions: [{ type: "OPEN_PAGE", label: "打开能力商店", route: cap.storeRoute }],
      };
      appendMessage(opts.sessionId, msg);
      return { userMessage, assistantMessages: [msg], intent };
    }
    const taskType = classifyWebCodeMTask(raw);
    const result = runWebCodeM(raw, { taskType });
    const card: ChatMessage = {
      id: newMessageId(),
      type: "WEBCODEM_RESULT",
      role: "assistant",
      intent,
      webCodeMResult: result,
      qaInfo: { status: result.qa.status === "BLOCKED" ? "BLOCK" : result.qa.status === "FAIL" ? "BLOCK" : result.qa.status === "WARN" ? "WARN" : "PASS", reasons: result.qa.issues.map((i) => i.message) },
      createdAt: new Date().toISOString(),
    };
    appendMessage(opts.sessionId, card);

    // 同步包装为统一 DISPLAY_RESULT 卡片回到对话界面
    const displayResult = webCodeMResultToDisplayResult(result, raw);
    const displayMsg = wrapResultAsMessage(displayResult);
    appendMessage(opts.sessionId, displayMsg);

    if (result.run.projectId) linkObject(opts.sessionId, result.run.projectId);
    if (result.run.runId) linkRun(opts.sessionId, result.run.runId);
    return { userMessage, assistantMessages: [card, displayMsg], intent };
  }


  // 强制 ANSWER_ONLY：等同 Ask 模式
  if (effectiveMode === "ANSWER_ONLY") {
    pushAnswer(raw, intent, out);
    out.forEach((m) => appendMessage(opts.sessionId, m));
    return { userMessage, assistantMessages: out, intent };
  }

  // 3. Ask 模式：只回答 + 提供下一步按钮
  if (intent.inputMode === "ASK_MODE") {
    pushAnswer(raw, intent, out);
    out.forEach((m) => appendMessage(opts.sessionId, m));
    return { userMessage, assistantMessages: out, intent };
  }

  // 4. Ask→Do 模式：先答，再出可执行选项卡片
  if (intent.inputMode === "ASK_TO_DO_MODE") {
    pushAnswer(raw, intent, out);
    out.push(buildAskToDoCard(raw, intent));
    out.forEach((m) => appendMessage(opts.sessionId, m));
    return { userMessage, assistantMessages: out, intent };
  }

  // 5. Mixed 模式：先输出分析，再尝试执行（高风险需确认）
  if (intent.inputMode === "MIXED_MODE") {
    out.push({
      id: newMessageId(),
      type: "ANALYSIS_CARD",
      role: "assistant",
      text: buildAnalysisText(raw, intent),
      intent,
      createdAt: new Date().toISOString(),
    });
    if (intent.needsConfirmation) {
      out.push(buildConfirmation(raw, intent));
      out.forEach((m) => appendMessage(opts.sessionId, m));
      return { userMessage, assistantMessages: out, intent };
    }
    // 继续走 DO 流程
  }

  // 6. DO 模式：打开页面 / 安装能力 / Runtime
  if (plan.shouldOpenPage && intent.pageRoute) {
    out.push({
      id: newMessageId(),
      type: "PAGE_NAVIGATION",
      role: "assistant",
      text: "已为你定位到对应页面。",
      routeTarget: { route: intent.pageRoute, label: intent.pageRoute, reason: intent.rationale },
      intent,
      createdAt: new Date().toISOString(),
      suggestedActions: buildSuggestedActions(intent, { pageRoute: intent.pageRoute }),
    });
    out.forEach((m) => appendMessage(opts.sessionId, m));
    return { userMessage, assistantMessages: out, intent };
  }

  if (intent.intentType === "DO_INSTALL" || intent.intentType === "INSTALL_CAPABILITY") {
    out.push({
      id: newMessageId(),
      type: "CAPABILITY_INSTALL_REQUIRED",
      role: "assistant",
      text: "请在能力商店选择并安装能力模型。",
      routeTarget: { route: "/webxxm-store", label: "能力商店" },
      intent,
      createdAt: new Date().toISOString(),
      suggestedActions: [{ type: "OPEN_PAGE", label: "打开能力商店", route: "/webxxm-store" }],
    });
    out.forEach((m) => appendMessage(opts.sessionId, m));
    return { userMessage, assistantMessages: out, intent };
  }

  // 7. 能力包检查
  if (intent.requiredCapability) {
    const cap = checkWebXXMForChat(intent.requiredCapability as WebCapabilityId);
    if (!cap.callable) {
      const msgType =
        cap.lifecycleStage === "NOT_DOWNLOADED"
          ? "CAPABILITY_DOWNLOAD_REQUIRED"
          : cap.lifecycleStage === "DOWNLOADED"
          ? "CAPABILITY_INSTALL_REQUIRED"
          : "CAPABILITY_REQUIRED";
      const defaultText =
        cap.lifecycleStage === "NOT_DOWNLOADED"
          ? `需要下载能力模型 ${intent.requiredCapability}。`
          : cap.lifecycleStage === "DOWNLOADED"
          ? `「${intent.requiredCapability}」已下载，需要安装后才能使用。`
          : `需要先启用 ${intent.requiredCapability} 才能继续。`;
      out.push({
        id: newMessageId(),
        type: msgType,
        role: "assistant",
        text: cap.message ?? defaultText,
        capability: cap,
        intent,
        routeTarget: { route: cap.storeRoute, label: "能力商店" },
        createdAt: new Date().toISOString(),
        suggestedActions: buildSuggestedActions(intent, {
          needsInstall: true,
          capabilityStoreRoute: cap.storeRoute,
        }),
      });
      out.forEach((m) => appendMessage(opts.sessionId, m));
      return { userMessage, assistantMessages: out, intent };
    }
  }

  // 8. 高风险动作需确认
  if (intent.needsConfirmation) {
    out.push(buildConfirmation(raw, intent));
    out.forEach((m) => appendMessage(opts.sessionId, m));
    return { userMessage, assistantMessages: out, intent };
  }

  // 9. 调度 Runtime Spine
  if (plan.shouldCallRuntime) {
    const run = callRuntimeSpine(raw);
    if (run.runId) linkRun(opts.sessionId, run.runId);
    if (run.createdObjectId) linkObject(opts.sessionId, run.createdObjectId);

    if (run.blocked) {
      out.push({
        id: newMessageId(),
        type: "ERROR_BLOCKED",
        role: "assistant",
        text: "运行被 QA 阻断。",
        blockedReasons: run.blockedReasons,
        qaInfo: { status: "BLOCK", reasons: run.blockedReasons },
        intent,
        createdAt: new Date().toISOString(),
      });
    } else {
      out.push({
        id: newMessageId(),
        type: "RUNTIME_RUN_RESULT",
        role: "assistant",
        text: `已通过 Runtime Spine 调度 ${run.runType}。`,
        runResult: run,
        intent,
        createdAt: new Date().toISOString(),
      });
      if (run.createdObjectId && intent.targetObjectType) {
        out.push({
          id: newMessageId(),
          type: "OBJECT_CREATED",
          role: "assistant",
          text: `已创建对象。`,
          objectInfo: {
            objectId: run.createdObjectId,
            objectType: intent.targetObjectType,
            title: `${intent.targetObjectType} · ${raw.slice(0, 24)}`,
            summary: raw,
          },
          intent,
          createdAt: new Date().toISOString(),
        });
      }
      out.push({
        id: newMessageId(),
        type: "QA_RESULT",
        role: "assistant",
        text: `检查结果：${run.qaStatus}`,
        qaInfo: { status: run.qaStatus, reasons: run.blockedReasons },
        intent,
        createdAt: new Date().toISOString(),
        suggestedActions: buildSuggestedActions(intent, { createdObjectId: run.createdObjectId }),
      });
    }
  } else {
    pushAnswer(raw, intent, out);
  }

  out.forEach((m) => appendMessage(opts.sessionId, m));
  return { userMessage, assistantMessages: out, intent };
}

/* ============ 内部辅助 ============ */

function pushAnswer(raw: string, intent: ChatIntentResult, out: ChatMessage[]) {
  out.push({
    id: newMessageId(),
    type: "ANSWER_CARD",
    role: "assistant",
    text: undefined,
    answerCard: {
      title: titleForAsk(intent),
      answer: buildAnswerText(raw, intent),
    },
    intent,
    createdAt: new Date().toISOString(),
    suggestedActions: buildSuggestedActions(intent, {}),
  });
}

function titleForAsk(intent: ChatIntentResult): string {
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

function buildAnswerText(raw: string, intent: ChatIntentResult): string {
  return [
    `针对你的提问，先给出我的判断（仅供参考，不替代计算法 / 常数 / QA 的裁决）。`,
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

function buildAnalysisText(raw: string, intent: ChatIntentResult): string {
  return [
    `已识别为复合请求（${intent.intentType}）。先给出分析摘要：`,
    `· 触发判断：${intent.rationale}`,
    intent.requiredCapability ? `· 涉及能力：${intent.requiredCapability}` : "",
    intent.targetObjectType ? `· 目标对象：${intent.targetObjectType}` : "",
    intent.needsConfirmation ? `· 检测到高风险动作，需要你二次确认后才会执行。` : "",
  ].filter(Boolean).join("\n");
}

function buildAskToDoCard(raw: string, intent: ChatIntentResult): ChatMessage {
  return {
    id: newMessageId(),
    type: "ASK_TO_DO_CARD",
    role: "assistant",
    intent,
    askToDoCard: {
      summary: `针对「${raw.slice(0, 40)}${raw.length > 40 ? "…" : ""}」，我给出可执行路径。`,
      feasibility: "FEASIBLE",
      recommendedPath: intent.recommendedPath ?? [],
      requiredCapabilities: intent.requiredCapability
        ? [{ id: intent.requiredCapability, installed: false, enabled: false }]
        : [],
    },
    createdAt: new Date().toISOString(),
    suggestedActions: buildSuggestedActions(intent, {}),
  };
}

function buildConfirmation(raw: string, intent: ChatIntentResult): ChatMessage {
  return {
    id: newMessageId(),
    type: "CONFIRMATION_REQUIRED",
    role: "assistant",
    text: "该动作涉及高风险操作，请确认后再执行。",
    confirmation: {
      action: intent.intentType,
      reason: "涉及删除 / 部署 / 上传 / 付款 / 真实执行等高风险类别。",
    },
    intent,
    createdAt: new Date().toISOString(),
    suggestedActions: [
      { type: "CONFIRM_ACTION", label: "确认执行", payload: { raw } },
      { type: "OPEN_PAGE", label: "查看 QA 规则", route: "/system-audit" },
    ],
  };
}
