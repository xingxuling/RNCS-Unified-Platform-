// WebCodeM / App Runtime / Code Sandbox → ChatDisplayResult 映射
// 让代码与应用主链的所有结果都以统一的 DISPLAY_RESULT 卡片回到对话界面。

import type {
  ChatDisplayResult,
  ChatDisplayResultType,
  ChatDisplayResultQa,
  ChatResultAction,
} from "./chatDisplayResultTypes";
import type {
  WebCodeMResult,
  WebCodeMTaskType,
  WebCodeMResultAction,
} from "@/lib/web-codem/webCodeMTypes";

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function mapResultType(taskType: WebCodeMTaskType): ChatDisplayResultType {
  switch (taskType) {
    case "CREATE_APP":
    case "IMPROVE_APP":
      return "APP";
    case "GENERATE_PATCH":
      return "PATCH";
    case "GENERATE_HANDOFF":
      return "CODE";
    case "GENERATE_CODE":
    case "CHECK_PROJECT":
    case "EXPLAIN_ERROR":
    case "REPAIR_CODE":
    default:
      return "CODE";
  }
}

function mapQaStatus(s?: string | null): ChatDisplayResultQa {
  switch (s) {
    case "PASS":
      return "PASS";
    case "WARN":
      return "WARN";
    case "FAIL":
      return "FAIL";
    case "BLOCKED":
      return "BLOCKED";
    default:
      return "NOT_CHECKED";
  }
}

function buildTitle(result: WebCodeMResult): string {
  const t = result.run.taskType;
  if (t === "CHECK_PROJECT") {
    const err = result.run.errorCount ?? 0;
    const warn = result.run.warningCount ?? 0;
    if (result.run.qaStatus === "BLOCKED") return "代码检查已阻断";
    if (err > 0) return "代码检查发现问题";
    if (warn > 0) return "代码检查完成，发现警告";
    return "代码检查通过";
  }
  if (t === "GENERATE_PATCH") return "修复草案已生成";
  if (t === "GENERATE_HANDOFF") {
    const tgt = result.run.handoffTarget ?? "CODEX";
    return `${tgt} 交接包已生成`;
  }
  if (t === "EXPLAIN_ERROR") return "错误解释已生成";
  if (t === "REPAIR_CODE") return "修复建议已生成";
  if (t === "GENERATE_CODE") return "代码草案已生成";
  if (t === "IMPROVE_APP") return "应用迭代草案已生成";
  if (t === "CREATE_APP") return "应用草案已生成";
  return result.cardTitle || "结果已生成";
}

function buildSummary(result: WebCodeMResult): string {
  const r = result.run;
  const t = r.taskType;
  if (t === "CREATE_APP" || t === "IMPROVE_APP" || t === "GENERATE_CODE") {
    return `${r.projectName ?? "应用"} · 已生成 ${r.fileCount ?? 0} 个文件 · QA ${r.qaStatus ?? "—"}`;
  }
  if (t === "CHECK_PROJECT") {
    return `错误 ${r.errorCount ?? 0} · 警告 ${r.warningCount ?? 0} · QA ${r.qaStatus ?? "—"}`;
  }
  if (t === "GENERATE_PATCH") {
    const p = r.patchSummary?.[0];
    return p
      ? `影响文件 ${p.file} · 风险 ${p.risk} · 仅为草案，需人工应用`
      : "已生成 Patch 草案，仅供 Codex / Cursor 应用";
  }
  if (t === "GENERATE_HANDOFF") {
    return `${r.handoffTarget ?? "CODEX"} 交接包 · ${r.handoffTitle ?? ""}`.trim();
  }
  if (t === "EXPLAIN_ERROR" || t === "REPAIR_CODE") {
    return `${(r.repairSummary && r.repairSummary[0]) ?? r.errors?.[0]?.message ?? "已生成建议"}`;
  }
  return result.cardBullets[0] ?? "已生成结果";
}

function mapAction(a: WebCodeMResultAction, rawInput: string): ChatResultAction {
  const base = { actionId: newId("act"), label: a.label } as ChatResultAction;

  if (a.type === "OPEN_PAGE") {
    return {
      ...base,
      actionType: "OPEN_DETAIL",
      targetRoute: a.route,
      style: "secondary",
    };
  }
  if (a.type === "WCM_CHECK" || a.type === "WCM_REPAIR" || a.type === "WCM_HANDOFF") {
    return {
      ...base,
      actionType: "RUN",
      style: a.type === "WCM_REPAIR" ? "primary" : "secondary",
      payload: {
        runner: "WEB_CODE_M",
        rawInput,
        ...(a.payload ?? {}),
      },
    };
  }
  return { ...base, actionType: "CUSTOM", payload: a.payload };
}

/**
 * 把 WebCodeMResult（含 App Runtime / Code Sandbox / Patch / Handoff 的产物）
 * 映射为统一的 ChatDisplayResult，供 DISPLAY_RESULT 消息渲染。
 */
export function webCodeMResultToDisplayResult(
  result: WebCodeMResult,
  rawInput: string,
): ChatDisplayResult {
  const resultType = mapResultType(result.run.taskType);
  const qaStatus = mapQaStatus(result.run.qaStatus ?? result.qa.status);

  const actions: ChatResultAction[] = result.actions.map((a) => mapAction(a, rawInput));

  // 通用动作：保存 / 继续追问
  actions.push({
    actionId: newId("act"),
    actionType: "SAVE",
    label: "保存到工作区",
    targetObjectId: result.run.projectId,
    targetRunId: result.run.runId,
    style: "secondary",
  });
  actions.push({
    actionId: newId("act"),
    actionType: "CONTINUE",
    label: "继续追问",
    style: "secondary",
  });

  // 交接包额外提供复制
  if (result.run.taskType === "GENERATE_HANDOFF") {
    actions.unshift({
      actionId: newId("act"),
      actionType: "COPY",
      label: "复制交接包",
      style: "primary",
    });
  }

  const mainContent = result.cardBullets.map((b) => `· ${b}`).join("\n");

  return {
    resultId: newId("dr"),
    resultType,
    title: buildTitle(result),
    summary: buildSummary(result),
    mainContent,
    structuredPreview: {
      taskType: result.run.taskType,
      bullets: result.cardBullets,
      mode: result.run.mode,
      modeNote: result.modeNote,
      handoffTarget: result.run.handoffTarget,
      errors: result.run.errors,
      patches: result.run.patchSummary,
      repair: result.run.repairSummary,
    },
    objectId: result.run.projectId,
    objectType: result.run.taskType,
    runId: result.run.runId,
    qaStatus,
    sourceModule:
      result.run.taskType === "GENERATE_PATCH" ||
      result.run.taskType === "REPAIR_CODE" ||
      result.run.taskType === "EXPLAIN_ERROR"
        ? "WebCodeM · Code Sandbox"
        : result.run.taskType === "CHECK_PROJECT"
          ? "Code Sandbox"
          : result.run.taskType === "GENERATE_HANDOFF"
            ? "WebCodeM · Handoff"
            : "WebCodeM · App Runtime",
    actions,
    createdAt: result.run.createdAt,
  };
}
