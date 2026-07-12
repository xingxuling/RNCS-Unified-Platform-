// Aether Record Center · 运行时主 API + 14 类来源 Bridge 整合
// 设计：所有来源通过 recordEvent() 写入；同时导出 recordChatTurn / recordModelCall / ... 等
// 命名清晰的便捷函数，避免 14 个孤立 bridge 文件造成迷宫。
import type { BuildEventInput } from "./recordEventBuilder";
import { buildRecordEvent } from "./recordEventBuilder";
import { appendEvent, getStats, listEvents, subscribeRecordStore, clearAll } from "./recordEventStore";
import type { RecordEvent } from "./recordCenterTypes";

// ===== 主 API =====
export function recordEvent(input: BuildEventInput): RecordEvent {
  const ev = buildRecordEvent(input);
  appendEvent(ev);
  return ev;
}

export const queryRecordEvents = listEvents;
export const getRecordCenterStats = getStats;
export const subscribeRecordCenter = subscribeRecordStore;
export const clearRecordCenter = clearAll;

// ============================================================
// 14 类来源 Bridge —— 全部薄封装，统一进入 recordEvent()
// ============================================================

// 1. Chat ---------------------------------------------------------------
export function recordChatTurn(input: {
  sessionId?: string;
  messageId?: string;
  question: string;
  answerPreview?: string;
  source?: string;     // PROVIDER / WEBLLM / RULE / FALLBACK
  qaStatus?: string;
  errorText?: string;
}) {
  const failed = !!input.errorText;
  return recordEvent({
    eventType: "CHAT_MESSAGE",
    sourceModule: "Chat",
    title: input.question?.slice(0, 60) || "(空输入)",
    summary: input.answerPreview || input.errorText || "",
    relatedIds: { chatSessionId: input.sessionId, messageId: input.messageId },
    status: failed ? "FAILED" : input.qaStatus === "BLOCK" ? "BLOCKED" : input.qaStatus === "WARN" ? "WARN" : "RECORDED",
    qaStatus: input.qaStatus,
    tags: [input.source || "PROVIDER"],
    canVerify: false,
  });
}

// 2. Model Provider -----------------------------------------------------
export function recordModelCall(input: {
  providerId: string;
  providerType?: string;
  modelId?: string;
  latencyMs?: number;
  success: boolean;
  errorText?: string;
  runId?: string;
  sessionId?: string;
  messageId?: string;
}) {
  return recordEvent({
    eventType: "MODEL_CALL",
    sourceModule: `Model · ${input.providerId}`,
    title: `${input.providerId}${input.modelId ? " / " + input.modelId : ""}`,
    summary: input.success
      ? `调用成功${typeof input.latencyMs === "number" ? `（${input.latencyMs} ms）` : ""}`
      : `调用失败：${input.errorText || "未知原因"}`,
    relatedIds: { modelCallId: input.runId, chatSessionId: input.sessionId, messageId: input.messageId },
    status: input.success ? "RECORDED" : "FAILED",
    tags: [input.providerType || "PROVIDER", input.success ? "OK" : "FAIL"],
  });
}

// 3. Fusion -------------------------------------------------------------
export function recordFusionPlan(input: {
  fusionPlanId?: string;
  calculusId?: string;
  drift?: number;
  domainsHit?: number;
  conceptCount?: number;
  sessionId?: string;
}) {
  return recordEvent({
    eventType: "FUSION_PLAN",
    sourceModule: "Fusion Runtime",
    title: `跨域融合 · ${input.calculusId || "calc"}`,
    summary: `域命中 ${input.domainsHit ?? "-"}；漂移 ${input.drift?.toFixed?.(3) ?? "-"}；概念 ${input.conceptCount ?? "-"}`,
    relatedIds: { fusionPlanId: input.fusionPlanId, chatSessionId: input.sessionId },
    status: (input.drift ?? 0) > 0.6 ? "WARN" : "RECORDED",
    tags: ["FUSION"],
  });
}

// 4. Sequence Memory ----------------------------------------------------
export function recordMemoryUnit(input: {
  memoryUnitId?: string;
  injectedCount?: number;
  compressionRatio?: number;
  sessionId?: string;
}) {
  return recordEvent({
    eventType: "SEQUENCE_MEMORY_CREATED",
    sourceModule: "Sequence Memory",
    title: "数列记忆压缩",
    summary: `注入 ${input.injectedCount ?? 0} 条；压缩率 ${input.compressionRatio?.toFixed?.(2) ?? "-"}`,
    relatedIds: { memoryUnitId: input.memoryUnitId, chatSessionId: input.sessionId },
    status: "RECORDED",
    tags: ["MEMORY"],
  });
}

// 5. Sequence Currency --------------------------------------------------
export function recordCurrencyEvent(input: {
  currencyEventId?: string;
  count?: number;
  totalCost?: number;
  sessionId?: string;
}) {
  return recordEvent({
    eventType: "SEQUENCE_CURRENCY_EVENT",
    sourceModule: "Sequence Currency",
    title: "价值账本",
    summary: `条目 ${input.count ?? 0}${typeof input.totalCost === "number" ? `；累计 ${input.totalCost}` : ""}`,
    relatedIds: { currencyEventId: input.currencyEventId, chatSessionId: input.sessionId },
    status: "RECORDED",
    tags: ["CURRENCY"],
  });
}

// 6. MSL ----------------------------------------------------------------
export function recordMslFrame(input: {
  mslFrameId?: string;
  frameType?: string;
  status?: "SUCCESS" | "WARN" | "BLOCKED" | "FALLBACK";
  sessionId?: string;
}) {
  const st = input.status || "SUCCESS";
  return recordEvent({
    eventType: "MSL_STATE_FRAME",
    sourceModule: "MSL",
    title: `MSL · ${input.frameType || "STATE_FRAME"}`,
    summary: `状态 ${st}`,
    relatedIds: { mslFrameId: input.mslFrameId, chatSessionId: input.sessionId },
    status: st === "BLOCKED" ? "BLOCKED" : st === "WARN" ? "WARN" : st === "FALLBACK" ? "WARN" : "RECORDED",
    tags: ["MSL", st],
  });
}

// 7. Prediction ---------------------------------------------------------
export function recordPrediction(input: {
  predictionId?: string;
  riskLevel?: string;
  trajectoriesCount?: number;
  sessionId?: string;
}) {
  return recordEvent({
    eventType: "PREDICTION_RESULT",
    sourceModule: "Sequence Prediction",
    title: "数列预测",
    summary: `轨迹 ${input.trajectoriesCount ?? 0}；风险 ${input.riskLevel || "-"}`,
    relatedIds: { predictionId: input.predictionId, chatSessionId: input.sessionId },
    status: input.riskLevel === "BLOCK" ? "BLOCKED" : input.riskLevel === "WARN" ? "WARN" : "RECORDED",
    tags: ["PREDICTION"],
    canVerify: true,
    expectedOutcome: "≥1 条轨迹被现实验证",
  });
}

// 8. Scheduler ----------------------------------------------------------
export function recordSchedulerTask(input: {
  taskId?: string;
  state?: string;     // CREATED / QUEUED / RUNNING / WAITING_CONFIRMATION / DONE / FAILED / BLOCKED
  taskType?: string;
  title?: string;
  sessionId?: string;
}) {
  const st = input.state || "CREATED";
  const status = st === "BLOCKED" ? "BLOCKED" : st === "FAILED" ? "FAILED" : st === "WAITING_CONFIRMATION" ? "WARN" : "RECORDED";
  return recordEvent({
    eventType: "SCHEDULER_TASK",
    sourceModule: "Scheduler",
    title: input.title || `任务 · ${input.taskType || st}`,
    summary: `状态 ${st}`,
    relatedIds: { taskId: input.taskId, chatSessionId: input.sessionId },
    status,
    tags: ["SCHEDULER", st],
    canVerify: st === "DONE",
  });
}

// 9. Workspace ----------------------------------------------------------
export function recordWorkspaceObject(input: {
  workspaceObjectId?: string;
  objectType?: string;
  title?: string;
  qaStatus?: string;
  sourceModule?: string;
}) {
  return recordEvent({
    eventType: "WORKSPACE_OBJECT",
    sourceModule: input.sourceModule || "Workspace",
    title: input.title || `对象 · ${input.objectType || "-"}`,
    summary: `QA ${input.qaStatus || "-"}`,
    relatedIds: { workspaceObjectId: input.workspaceObjectId },
    status: input.qaStatus === "BLOCK" ? "BLOCKED" : input.qaStatus === "WARN" ? "WARN" : "RECORDED",
    qaStatus: input.qaStatus,
    tags: ["WORKSPACE", input.objectType || ""],
  });
}

// 10. Store / WebXXM ----------------------------------------------------
export function recordStorePackageAction(input: {
  packageId: string;
  action: "OPEN" | "INSTALL" | "ENABLE" | "USE" | "BLOCKED";
  detail?: string;
}) {
  const blocked = input.action === "BLOCKED";
  return recordEvent({
    eventType: "STORE_PACKAGE_USED",
    sourceModule: "Store",
    title: `${input.packageId} · ${input.action}`,
    summary: input.detail || "",
    status: blocked ? "BLOCKED" : "RECORDED",
    tags: ["STORE", input.action],
  });
}

// 11. Calendar ----------------------------------------------------------
export function recordCalendarEvent(input: {
  calendarTaskId?: string;
  action: "CREATE" | "FIRE" | "DONE" | "EXPIRED";
  title?: string;
}) {
  return recordEvent({
    eventType: "CALENDAR_TRIGGER",
    sourceModule: "Calendar",
    title: input.title || `日历 · ${input.action}`,
    summary: `动作 ${input.action}`,
    relatedIds: { calendarTaskId: input.calendarTaskId },
    status: input.action === "EXPIRED" ? "WARN" : "RECORDED",
    tags: ["CALENDAR", input.action],
    canVerify: input.action === "FIRE" || input.action === "DONE",
  });
}

// 12. Social ------------------------------------------------------------
export function recordSocialAction(input: {
  socialPostId?: string;
  action: "DRAFT" | "PUBLISH" | "BLOCKED" | "VISIBILITY_CHANGE" | "AUDIT";
  visibility?: string;
  reason?: string;
}) {
  const blocked = input.action === "BLOCKED";
  return recordEvent({
    eventType: "SOCIAL_ACTION",
    sourceModule: "Social",
    title: `社交 · ${input.action}`,
    summary: input.reason || (input.visibility ? `可见性 ${input.visibility}` : ""),
    relatedIds: { socialPostId: input.socialPostId },
    status: blocked ? "BLOCKED" : "RECORDED",
    tags: ["SOCIAL", input.action],
  });
}

// 13. QA / Bug Audit ----------------------------------------------------
export function recordQaAudit(input: {
  auditId?: string;
  scope: string;
  qaStatus?: "PASS" | "WARN" | "BLOCK";
  fixedCount?: number;
  openCount?: number;
}) {
  const q = input.qaStatus || "PASS";
  return recordEvent({
    eventType: "QA_AUDIT",
    sourceModule: "QA / Bug Audit",
    title: `${input.scope} · QA ${q}`,
    summary: `已修 ${input.fixedCount ?? "-"}；未修 ${input.openCount ?? "-"}`,
    relatedIds: { auditId: input.auditId },
    status: q === "BLOCK" ? "BLOCKED" : q === "WARN" ? "WARN" : "RECORDED",
    qaStatus: q,
    tags: ["QA", q],
  });
}

// 14. Legacy Module -----------------------------------------------------
export function recordLegacyAction(input: {
  legacyModuleId: string;
  action: "REGISTER" | "BRIDGE_DRAFT" | "ACTIVATE_SUGGEST" | "TASK_SUGGEST";
  detail?: string;
  isP0?: boolean;
}) {
  return recordEvent({
    eventType: "LEGACY_MODULE_ACTION",
    sourceModule: "Legacy Module Registry",
    title: `${input.legacyModuleId} · ${input.action}`,
    summary: input.detail || "",
    relatedIds: { legacyModuleId: input.legacyModuleId },
    status: "RECORDED",
    tags: ["LEGACY", input.action, input.isP0 ? "P0" : ""],
    relatedLegacyP0: input.isP0,
  });
}

// 15. Sequence Agent / Sequence AI -------------------------------------
export function recordAgentRun(input: {
  agentRunId?: string;
  mode: "SINGLE_AGENT" | "PANEL_REVIEW" | "CHAIN_OF_AGENTS" | "SEQUENCE_AI";
  agentIds?: string[];
  conclusion?: string;
  sessionId?: string;
}) {
  return recordEvent({
    eventType: input.mode === "SEQUENCE_AI" ? "SEQUENCE_AI_RUN" : "AGENT_RUN",
    sourceModule: input.mode === "SEQUENCE_AI" ? "Sequence AI" : "Sequence Agent",
    title: `${input.mode} · ${input.agentIds?.join("/") || "-"}`,
    summary: input.conclusion || "",
    relatedIds: { agentRunId: input.agentRunId, chatSessionId: input.sessionId },
    status: "RECORDED",
    tags: [input.mode, ...(input.agentIds || [])],
  });
}

// 16. Analytics 接入预留 -----------------------------------------------
export function getRecordCenterAnalytics() {
  const stats = getStats();
  return {
    总记录数: stats.total,
    今日记录数: stats.today,
    高重要记录数: stats.highImportance,
    WARN: stats.warnCount,
    BLOCK: stats.blockCount,
    可回验记录数: stats.canVerifyCount,
    分类分布: stats.byType,
  };
}
