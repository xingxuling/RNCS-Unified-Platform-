// WebCodeM 单点强化运行时
// 链路：任务识别 → 上下文 → 应用需求/架构/文件树/代码草案 → App Runtime → Code Sandbox
//      → 错误解释 → 修复建议 → Patch 草案 → 交接包 → QA → Workspace
//
// 安全：不执行危险命令、不部署、不删除本地文件、不声称模拟为真实执行；
//      真实 WebLLM 不 READY 时降级为规则模板，不卡死、不报错。

import { runAetherAppRuntime } from "@/lib/app-runtime/aetherAppRuntime";
import { runCodeSandbox } from "@/lib/code-sandbox/aetherCodeSandboxBridge";
import { generateHandoffPack } from "@/lib/app-runtime/appHandoffPackEngine";
import type { AppProjectObject, AppHandoffPack } from "@/lib/app-runtime/appProjectObjectEngine";
import { getRealWebLlmRuntimeState } from "@/lib/real-webllm/aetherRealWebLlmRuntime";
import { classifyWebCodeMTask } from "./webCodeMTaskClassifier";
import { runWebCodeMQa } from "./webCodeMQaEngine";
import { saveWebCodeMRun } from "./webCodeMRunStore";
import { getLatestWebCodeMProject, saveLatestWebCodeMProject } from "./webCodeMProjectStore";
import type {
  WebCodeMResult,
  WebCodeMRunRecord,
  WebCodeMTaskType,
  WebCodeMResultAction,
  WebCodeMMode,
} from "./webCodeMTypes";

function newRunId(): string {
  return `wcm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function resolveMode(): { mode: WebCodeMMode; llmReady: boolean; modeNote: string } {
  try {
    const rt = getRealWebLlmRuntimeState();
    const ready = !!rt && rt.engineStatus === "READY";
    if (ready) {
      return { mode: "REAL_WEBLLM", llmReady: true, modeNote: "本轮使用真实 WebLLM 生成。" };
    }
  } catch {
    /* no-op — 视为未就绪 */
  }
  return {
    mode: "RULE_TEMPLATE",
    llmReady: false,
    modeNote: "当前使用规则模式生成（真实 WebLLM 未就绪，已自动降级）。",
  };
}

function projectBaseRun(taskType: WebCodeMTaskType, raw: string, project?: AppProjectObject): WebCodeMRunRecord {
  const { mode, llmReady } = resolveMode();
  return {
    runId: newRunId(),
    taskType,
    rawInput: raw,
    source: "WEB_CODE_M",
    mode,
    llmReady,
    projectId: project?.projectId,
    projectName: project?.projectName,
    appType: project?.appType,
    fileCount: project?.codeFiles.length,
    qaStatus: project?.qaResult?.status,
    notes: [],
    createdAt: new Date().toISOString(),
  };
}

function buildActions(taskType: WebCodeMTaskType, run: WebCodeMRunRecord): WebCodeMResultAction[] {
  const out: WebCodeMResultAction[] = [];
  if (run.projectId) {
    out.push({ type: "OPEN_PAGE", label: "打开应用项目", route: "/app-runtime" });
  }
  switch (taskType) {
    case "CREATE_APP":
    case "GENERATE_CODE":
    case "IMPROVE_APP":
      out.push({ type: "WCM_CHECK", label: "运行代码检查", payload: { taskType: "CHECK_PROJECT" } });
      out.push({ type: "WCM_HANDOFF", label: "生成 Codex 包", payload: { taskType: "GENERATE_HANDOFF", target: "CODEX" } });
      out.push({ type: "OPEN_PAGE", label: "打开代码沙箱", route: "/code-sandbox" });
      break;
    case "CHECK_PROJECT":
      if ((run.errorCount ?? 0) + (run.warningCount ?? 0) > 0) {
        out.push({ type: "WCM_REPAIR", label: "生成修复建议", payload: { taskType: "REPAIR_CODE" } });
      }
      out.push({ type: "WCM_CHECK", label: "重新检查", payload: { taskType: "CHECK_PROJECT" } });
      break;
    case "EXPLAIN_ERROR":
    case "REPAIR_CODE":
    case "GENERATE_PATCH":
      out.push({ type: "WCM_HANDOFF", label: "生成 Codex 包", payload: { taskType: "GENERATE_HANDOFF", target: "CODEX" } });
      out.push({ type: "WCM_CHECK", label: "重新检查", payload: { taskType: "CHECK_PROJECT" } });
      break;
    case "GENERATE_HANDOFF":
      out.push({ type: "OPEN_PAGE", label: "打开应用项目", route: "/app-runtime" });
      break;
  }
  out.push({ type: "OPEN_PAGE", label: "查看 QA", route: "/system-audit" });
  return out;
}

/** CREATE_APP / GENERATE_CODE / IMPROVE_APP — 调 App Runtime 全链 */
function runCreateApp(raw: string, taskType: WebCodeMTaskType): WebCodeMResult {
  const appRun = runAetherAppRuntime(raw);
  const project = appRun.project;
  saveLatestWebCodeMProject(project);

  const run = projectBaseRun(taskType, raw, project);
  run.notes.push(
    `识别为 ${appRun.intent.appType}，运行模式 ${appRun.intent.runtimeModeRecommendation}`,
    `生成 ${project.codeFiles.length} 个文件，${project.handoffPacks.length} 个交接包草案`,
  );
  const qa = runWebCodeMQa(run, { simulatedOnly: true });

  const bullets = [
    `应用名称：${project.projectName}`,
    `应用类型：${project.appType}`,
    `MVP 范围：${project.mvpScope.slice(0, 3).join("、") || "—"}`,
    `已生成文件：${project.codeFiles.length} 个`,
    `QA 状态：${project.qaResult?.status ?? "—"}`,
  ];

  const { modeNote } = resolveMode();
  const result: WebCodeMResult = {
    run,
    qa,
    cardTitle: taskType === "IMPROVE_APP" ? "应用迭代草案已生成" : "应用草案已生成",
    cardBullets: bullets,
    modeNote,
    actions: buildActions(taskType, run),
  };
  saveWebCodeMRun(run);
  return result;
}

/** CHECK_PROJECT — 调 Code Sandbox */
function runCheckProject(raw: string): WebCodeMResult {
  const project = getLatestWebCodeMProject();
  const { modeNote } = resolveMode();
  if (!project) {
    const run = projectBaseRun("CHECK_PROJECT", raw);
    run.notes.push("未找到可检查的项目，请先创建应用。");
    const qa = runWebCodeMQa(run, { simulatedOnly: true });
    saveWebCodeMRun(run);
    return {
      run,
      qa,
      cardTitle: "未找到可检查的项目",
      cardBullets: ["请先用「做一个 …」创建一个应用项目。"],
      modeNote,
      actions: [{ type: "OPEN_PAGE", label: "打开应用生成器", route: "/app-runtime" }],
    };
  }

  const runResult = runCodeSandbox(project, { runnerMode: "STATIC_HTML_RUNNER", runPurpose: "WebCodeM 触发的代码检查" });
  const errSummary = runResult.errorSummary;
  const errFirstFile = errSummary?.affectedFiles?.[0];
  const errSeverities = errSummary ? [errSummary] : [];
  const high = errSeverities.filter((e) => e.severity === "HIGH" || e.severity === "CRITICAL").length;
  const warn = errSeverities.length - high;

  const run = projectBaseRun("CHECK_PROJECT", raw, project);
  run.codeRunId = runResult.runId;
  run.errorCount = high;
  run.warningCount = warn;
  run.qaStatus = runResult.qaResult?.status ?? project.qaResult?.status;
  run.errors = errSummary
    ? [{ file: errFirstFile, severity: errSummary.severity, message: errSummary.title }]
    : [];

  run.notes.push(`运行模式：${runResult.runnerMode}`, `状态：${runResult.status}`);
  const qa = runWebCodeMQa(run, { simulatedOnly: true });
  saveWebCodeMRun(run);

  return {
    run,
    qa,
    cardTitle: "代码检查完成",
    cardBullets: [
      `状态：${runResult.status}`,
      `错误数：${high}`,
      `警告数：${warn}`,
      `QA 状态：${run.qaStatus ?? "—"}`,
    ],
    modeNote,
    actions: buildActions("CHECK_PROJECT", run),
  };
}

/** EXPLAIN_ERROR / REPAIR_CODE / GENERATE_PATCH — 复用 Sandbox 输出的 repair / patch */
function runRepairFlow(raw: string, taskType: WebCodeMTaskType): WebCodeMResult {
  const project = getLatestWebCodeMProject();
  const { modeNote } = resolveMode();
  if (!project) {
    const run = projectBaseRun(taskType, raw);
    run.notes.push("未找到目标项目。");
    const qa = runWebCodeMQa(run, { simulatedOnly: true });
    saveWebCodeMRun(run);
    return {
      run, qa,
      cardTitle: "未找到目标项目",
      cardBullets: ["请先创建应用再触发修复 / Patch / 错误解释。"],
      modeNote,
      actions: [{ type: "OPEN_PAGE", label: "打开应用生成器", route: "/app-runtime" }],
    };
  }

  const runResult = runCodeSandbox(project, { runnerMode: "STATIC_HTML_RUNNER", runPurpose: `WebCodeM ${taskType}` });
  const repair = runResult.repairSuggestions ?? [];
  const patches = runResult.patchDrafts ?? [];

  const run = projectBaseRun(taskType, raw, project);
  run.codeRunId = runResult.runId;
  run.errorCount = (runResult.errorSummary ? 1 : 0);
  run.warningCount = 0;
  run.qaStatus = runResult.qaResult?.status;
  const errSum = runResult.errorSummary;
  run.errors = errSum
    ? [{ file: errSum.affectedFiles?.[0], severity: errSum.severity, message: errSum.title }]
    : [];
  run.repairSummary = repair.map((r) => `${r.affectedFiles?.[0] ?? "-"}：${r.title}`).slice(0, 5);
  run.patchSummary = patches.slice(0, 5).map((p) => ({
    file: p.affectedFile ?? "-",
    risk: p.requiresHumanReview ? "HIGH" : "LOW",
    reason: p.afterSummary ?? p.beforeSummary ?? "—",
  }));
  run.notes.push(
    `检测到 ${repair.length} 条修复建议、${patches.length} 个 Patch 草案`,
    "Patch 为草案，需交给 Codex / Cursor 应用，平台不会自动写入本地文件。",
  );
  const qa = runWebCodeMQa(run, { simulatedOnly: true });
  saveWebCodeMRun(run);

  const title =
    taskType === "EXPLAIN_ERROR" ? "错误解释已生成"
    : taskType === "GENERATE_PATCH" ? "Patch 草案已生成"
    : "修复建议已生成";

  const firstPatch = patches[0];
  const bullets =
    taskType === "GENERATE_PATCH"
      ? [
          `Patch 数量：${patches.length}`,
          `首个影响文件：${firstPatch?.affectedFile ?? "—"}`,
          `风险等级：${firstPatch ? (firstPatch.requiresHumanReview ? "HIGH" : "LOW") : "—"}`,
          `安全提示：${firstPatch?.safetyNotes?.[0] ?? "需人工审查"}`,
        ]
      : [
          `影响文件：${run.errors?.[0]?.file ?? "—"}`,
          `修复条数：${repair.length}`,
          `首条摘要：${repair[0]?.title ?? "—"}`,
          `风险等级：${firstPatch ? (firstPatch.requiresHumanReview ? "HIGH" : "LOW") : "LOW"}`,
        ];


  return {
    run, qa,
    cardTitle: title,
    cardBullets: bullets,
    modeNote,
    actions: buildActions(taskType, run),
  };
}

/** GENERATE_HANDOFF — 生成 Codex / Cursor / Lovable 交接包 */
function runHandoff(raw: string, target: "CODEX" | "CURSOR" | "LOVABLE" = "CODEX"): WebCodeMResult {
  const project = getLatestWebCodeMProject();
  const { modeNote } = resolveMode();
  if (!project) {
    const run = projectBaseRun("GENERATE_HANDOFF", raw);
    run.handoffTarget = target;
    run.notes.push("未找到目标项目。");
    const qa = runWebCodeMQa(run, { simulatedOnly: true });
    saveWebCodeMRun(run);
    return {
      run, qa,
      cardTitle: "未找到目标项目",
      cardBullets: ["请先创建应用再生成交接包。"],
      modeNote,
      actions: [{ type: "OPEN_PAGE", label: "打开应用生成器", route: "/app-runtime" }],
    };
  }
  const pack: AppHandoffPack = generateHandoffPack(project, target);
  const run = projectBaseRun("GENERATE_HANDOFF", raw, project);
  run.handoffTarget = target;
  run.handoffTitle = pack.title;
  run.notes.push(
    `生成 ${target} 交接包：${pack.includedFiles.length} 个文件`,
    `验收标准：${pack.acceptanceCriteria.length} 条`,
    "交接包仅供外部工具使用，不会触发真实执行。",
  );
  const qa = runWebCodeMQa(run, { simulatedOnly: true });
  saveWebCodeMRun(run);

  return {
    run, qa,
    cardTitle: `${target} 交接包已生成`,
    cardBullets: [
      `标题：${pack.title}`,
      `包含文件：${pack.includedFiles.length} 个`,
      `验收标准：${pack.acceptanceCriteria.length} 条`,
      `安全边界：${pack.safetyBoundaries.length} 条`,
    ],
    modeNote,
    actions: [
      { type: "OPEN_PAGE", label: "打开应用项目", route: "/app-runtime" },
      { type: "OPEN_PAGE", label: "查看 QA", route: "/system-audit" },
    ],
  };
}

export interface RunWebCodeMOptions {
  taskType?: WebCodeMTaskType;
  handoffTarget?: "CODEX" | "CURSOR" | "LOVABLE";
}

/** 主入口 */
export function runWebCodeM(raw: string, opts: RunWebCodeMOptions = {}): WebCodeMResult {
  const taskType = opts.taskType ?? classifyWebCodeMTask(raw);
  switch (taskType) {
    case "CREATE_APP":
    case "GENERATE_CODE":
    case "IMPROVE_APP":
      return runCreateApp(raw, taskType);
    case "CHECK_PROJECT":
      return runCheckProject(raw);
    case "EXPLAIN_ERROR":
    case "REPAIR_CODE":
    case "GENERATE_PATCH":
      return runRepairFlow(raw, taskType);
    case "GENERATE_HANDOFF":
      return runHandoff(raw, opts.handoffTarget ?? "CODEX");
    default:
      return runCreateApp(raw, "CREATE_APP");
  }
}
