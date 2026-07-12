// AetherBoss · 决策运行时 / 工厂调度器 / 失败恢复器 / 今日增长报告
import {
  buildCompanyCard,
  buildMaterialCard,
  buildOverview,
  buildTrainingCard,
  createFactoryTask,
} from "@/lib/aetherworld-autonomous-factory/autonomousFactoryRuntime";
import { listFactoryTasks } from "@/lib/aetherworld-autonomous-factory/autonomousFactoryStore";
import type {
  AutonomousFactoryTask,
  FactoryTaskType,
  FactoryKind as AFFactoryKind,
} from "@/lib/aetherworld-autonomous-factory/autonomousFactoryTypes";
import {
  getAgentState,
  getSchedule,
  listDecisions,
  listRecoveryPlans,
  listReports,
  listRuns,
  saveDecision,
  saveRecoveryPlan,
  saveReport,
  saveRun,
  setAgentState,
  setSchedule,
} from "./aetherbossStore";
import type {
  AetherBossAction,
  AetherBossDailyGrowthReport,
  AetherBossDecision,
  AetherBossFactory,
  AetherBossMode,
  AetherBossObservation,
  AetherBossPriority,
  AetherBossRecoveryPlan,
  AetherBossRun,
  HeartbeatSchedule,
  RecoveryFailureKind,
} from "./aetherbossTypes";
import { MODE_INTERVAL_MINUTES } from "./aetherbossTypes";

function nid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---- Observation ----
export function observe(): AetherBossObservation {
  const tasks = listFactoryTasks();
  const material = buildMaterialCard();
  const training = buildTrainingCard(false);
  const company = buildCompanyCard();
  const today = new Date().toISOString().slice(0, 10);
  return {
    materialPool: material.samplePool,
    sealedDatasets: material.sealedDatasets,
    trainingRunning: training.activeRun !== "无运行任务",
    trainingCompleted: tasks.filter((t) => t.factory === "TRAINING" && t.status === "COMPLETED")
      .length,
    companyDrafts: company.storeDrafts,
    failedTasks: tasks.filter((t) => t.status === "FAILED").length,
    daemonReady: training.daemonStatus === "READY",
    recentFeedback: 0,
    brokenRoutes: 0,
    todayTaskCount: tasks.filter((t) => t.createdAt.startsWith(today)).length,
  };
}

export function summarizeObservation(obs: AetherBossObservation): string {
  const parts = [
    `样本池 ${obs.materialPool}`,
    `已封版数据集 ${obs.sealedDatasets}`,
    obs.trainingRunning ? "训练进行中" : "训练空闲",
    `公司草案 ${obs.companyDrafts}`,
    obs.failedTasks > 0 ? `失败任务 ${obs.failedTasks}` : "无失败任务",
    `今日新增任务 ${obs.todayTaskCount}`,
  ];
  return parts.join(" · ");
}

// ---- Decision ----
interface DecisionDraft {
  factory: AetherBossFactory;
  action: AetherBossAction;
  priority: AetherBossPriority;
  reason: string;
  expectedValue: string;
  requiredConfirmation: boolean;
}

function pickDecision(obs: AetherBossObservation, mode: AetherBossMode): DecisionDraft {
  // P0: 失败任务优先
  if (obs.failedTasks > 0) {
    return {
      factory: "SYSTEM_HEALTH",
      action: "RECOVER_FAILED_TASK",
      priority: "P0",
      reason: `检测到 ${obs.failedTasks} 个失败任务，先恢复以释放工厂运力`,
      expectedValue: "恢复阻断任务，避免工厂停摆",
      requiredConfirmation: false,
    };
  }
  // 竞争模式：优先抢用户 / 数据 / 资产
  if (mode === "COMPETITION_MODE") {
    if (obs.materialPool < 50) {
      return draftIntake();
    }
    if (obs.companyDrafts < 3) {
      return draftStoreDraft();
    }
    if (obs.sealedDatasets === 0) {
      return draftDatasetVersion();
    }
    return draftCapabilityPackage();
  }
  // 常规优先级
  if (obs.materialPool < 20) return draftIntake();
  if (obs.sealedDatasets === 0) return draftDatasetVersion();
  if (obs.trainingCompleted === 0 && !obs.trainingRunning) return draftTrainingPlan();
  if (obs.companyDrafts === 0) return draftCapabilityPackage();
  return {
    factory: "SYSTEM_HEALTH",
    action: "GENERATE_NEXT_PROMPT",
    priority: "P3",
    reason: "工厂运行平稳，生成下一步 Prompt 建议",
    expectedValue: "持续推进，避免空转",
    requiredConfirmation: false,
  };
}

function draftIntake(): DecisionDraft {
  return {
    factory: "MATERIAL",
    action: "INTAKE_MORE_MATERIAL",
    priority: "P1",
    reason: "样本池偏少，继续投喂以扩大可训练数据基底",
    expectedValue: "新增样本与 token，支撑后续数据集与训练",
    requiredConfirmation: false,
  };
}
function draftDatasetVersion(): DecisionDraft {
  return {
    factory: "MATERIAL",
    action: "BUILD_DATASET_VERSION",
    priority: "P1",
    reason: "未发现已封版数据集，先封冒烟版用于训练对照",
    expectedValue: "得到首个 AetherSeed Smoke 数据集候选",
    requiredConfirmation: false,
  };
}
function draftTrainingPlan(): DecisionDraft {
  return {
    factory: "TRAINING",
    action: "CREATE_TRAINING_PLAN",
    priority: "P1",
    reason: "训练工厂空闲，生成下一炉训练计划草案",
    expectedValue: "形成 AetherSeed 血统训练计划草案",
    requiredConfirmation: false,
  };
}
function draftCapabilityPackage(): DecisionDraft {
  return {
    factory: "COMPANY",
    action: "CREATE_CAPABILITY_PACKAGE",
    priority: "P2",
    reason: "已有训练或数据成果，封装能力包供商店草案使用",
    expectedValue: "形成可被客户使用的能力包",
    requiredConfirmation: false,
  };
}
function draftStoreDraft(): DecisionDraft {
  return {
    factory: "COMPANY",
    action: "CREATE_STORE_DRAFT",
    priority: "P1",
    reason: "竞争模式优先生成商店草案以争取客户",
    expectedValue: "新增商店草案与客户材料",
    requiredConfirmation: false,
  };
}

const ACTION_TO_FACTORY_TASK: Partial<Record<AetherBossAction, FactoryTaskType>> = {
  INTAKE_MORE_MATERIAL: "INTAKE",
  BUILD_DATASET_VERSION: "DATASET_BUILD",
  EXPORT_TRAINING_PACKAGE: "EXPORT",
  CREATE_TRAINING_PLAN: "TRAINING_PLAN",
  RUN_DRY_RUN: "DRY_RUN",
  START_UNATTENDED_TRAINING: "TRAINING_RUN",
  RECOVER_FAILED_TASK: "RECOVERY",
  CREATE_CAPABILITY_PACKAGE: "CAPABILITY_PACKAGE",
  CREATE_STORE_DRAFT: "STORE_DRAFT",
  TURN_FEEDBACK_INTO_DATA: "FEEDBACK_TO_DATASET",
};

const ACTION_TO_AF_FACTORY: Partial<Record<AetherBossAction, AFFactoryKind>> = {
  INTAKE_MORE_MATERIAL: "MATERIAL",
  BUILD_DATASET_VERSION: "MATERIAL",
  EXPORT_TRAINING_PACKAGE: "MATERIAL",
  CREATE_TRAINING_PLAN: "TRAINING",
  RUN_DRY_RUN: "TRAINING",
  START_UNATTENDED_TRAINING: "TRAINING",
  CREATE_CAPABILITY_PACKAGE: "COMPANY",
  CREATE_STORE_DRAFT: "COMPANY",
  TURN_FEEDBACK_INTO_DATA: "COMPANY",
};

// ---- Single decision run ----
export interface RunOnceResult {
  run: AetherBossRun;
  decision: AetherBossDecision;
  createdTaskIds: string[];
}

export function runOnce(): RunOnceResult {
  const state = getAgentState();
  const mode = state.mode;
  const obs = observe();
  const summary = summarizeObservation(obs);
  const draft = pickDecision(obs, mode);

  const runId = nid("bossrun");
  const decisionId = nid("bossdec");
  const createdTaskIds: string[] = [];

  // 决策是否真的创建任务，受模式控制
  const allowCreate =
    mode === "PLAN_ONLY" ||
    mode === "SEMI_AUTO" ||
    mode === "UNATTENDED" ||
    mode === "COMPETITION_MODE";
  const onlyDraftTasks = mode === "PLAN_ONLY";

  if (allowCreate && draft.action !== "WAIT") {
    const tType = ACTION_TO_FACTORY_TASK[draft.action];
    const fk = ACTION_TO_AF_FACTORY[draft.action];
    if (tType && fk) {
      const task = createFactoryTask({
        factory: fk,
        taskType: tType,
        title: `[总策] ${draft.reason}`,
        priority: draft.priority === "P0" ? "P0" : draft.priority,
        automationLevel: onlyDraftTasks ? "L1" : mode === "UNATTENDED" ? "L3" : "L2",
      });
      createdTaskIds.push(task.id);
    }
  }

  const decision: AetherBossDecision = {
    id: decisionId,
    agentRunId: runId,
    observationSummary: summary,
    priority: draft.priority,
    chosenFactory: draft.factory,
    chosenAction: draft.action,
    reason: draft.reason,
    expectedValue: draft.expectedValue,
    requiredConfirmation: draft.requiredConfirmation,
    generatedTaskIds: createdTaskIds,
    createdAt: new Date().toISOString(),
  };
  saveDecision(decision);

  const run: AetherBossRun = {
    id: runId,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    mode,
    observationSummary: summary,
    decisionIds: [decisionId],
    notes: [
      `模式：${mode}`,
      onlyDraftTasks ? "PLAN_ONLY：只生成任务草案，不自动执行" : "可推进低风险工厂动作",
    ],
  };
  saveRun(run);

  // 更新调度时间
  const schedule = getSchedule();
  const next = new Date(Date.now() + schedule.intervalMinutes * 60 * 1000).toISOString();
  setSchedule({ lastRunAt: run.startedAt, nextRunAt: next });
  setAgentState({ lastRunAt: run.startedAt, nextRunAt: next });

  return { run, decision, createdTaskIds };
}

// ---- Recovery planner ----
function classifyFailure(reason?: string): RecoveryFailureKind {
  const r = (reason ?? "").toLowerCase();
  if (r.includes("route") || r.includes("404")) return "ROUTE_ERROR";
  if (r.includes("tsc") || r.includes("type")) return "TSC_ERROR";
  if (r.includes("train")) return "TRAINING_ERROR";
  if (r.includes("gateway") || r.includes("daemon")) return "LOCAL_GATEWAY_ERROR";
  if (r.includes("export") || r.includes("dataset")) return "DATASET_EXPORT_ERROR";
  if (r.includes("permission") || r.includes("denied")) return "PERMISSION_ERROR";
  if (r.includes("data") || r.includes("sample")) return "DATA_ERROR";
  return "UNKNOWN";
}

export function planRecoveryFor(task: AutonomousFactoryTask): AetherBossRecoveryPlan {
  const kind = classifyFailure(task.failureReason);
  const steps: string[] = [];
  let auto = false;
  let needsConfirm = true;
  switch (kind) {
    case "DATA_ERROR":
      steps.push("重新扫描样本质量", "去重并标记低质样本", "重新构建数据集候选");
      auto = true;
      needsConfirm = false;
      break;
    case "ROUTE_ERROR":
      steps.push("检查路由文件", "重建 routeTree", "在 Page Completeness 中重新登记");
      auto = false;
      break;
    case "TSC_ERROR":
      steps.push("定位类型不一致的导出", "补齐缺失类型", "tsc --noEmit 校验");
      auto = false;
      break;
    case "TRAINING_ERROR":
      steps.push("检查显存与日志", "降批量或切换 QLoRA", "重新生成训练计划草案");
      needsConfirm = true;
      break;
    case "LOCAL_GATEWAY_ERROR":
      steps.push("检查 :18777 守护进程", "重启本地执行网关", "重跑健康检查");
      needsConfirm = true;
      break;
    case "DATASET_EXPORT_ERROR":
      steps.push("重新选择导出格式", "重新校验样本许可", "生成新的导出包");
      auto = true;
      needsConfirm = false;
      break;
    case "PERMISSION_ERROR":
      steps.push("提示用户确认权限", "回退到只读模式", "记录到 Bug Audit");
      needsConfirm = true;
      break;
    default:
      steps.push("查看任务日志", "记录现象到 Bug Audit", "由用户选择恢复路径");
  }
  const plan: AetherBossRecoveryPlan = {
    id: nid("bossrec"),
    failedTaskId: task.id,
    kind,
    autoRecoverable: auto,
    steps,
    needsConfirmation: needsConfirm,
    createdAt: new Date().toISOString(),
  };
  saveRecoveryPlan(plan);
  return plan;
}

export function planRecoveryForAllFailures(): AetherBossRecoveryPlan[] {
  const failed = listFactoryTasks().filter((t) => t.status === "FAILED");
  const existing = new Set(listRecoveryPlans().map((p) => p.failedTaskId));
  const created: AetherBossRecoveryPlan[] = [];
  for (const t of failed) {
    if (existing.has(t.id)) continue;
    created.push(planRecoveryFor(t));
  }
  return created;
}

// ---- Daily report ----
export function buildDailyReport(): AetherBossDailyGrowthReport {
  const today = new Date().toISOString().slice(0, 10);
  const tasks = listFactoryTasks();
  const todayTasks = tasks.filter((t) => t.createdAt.startsWith(today));
  const overview = buildOverview();
  const material = buildMaterialCard();
  const training = buildTrainingCard(false);
  const company = buildCompanyCard();
  const recoveries = listRecoveryPlans().filter((p) => p.createdAt.startsWith(today));
  const decisions = listDecisions().filter((d) => d.createdAt.startsWith(today));

  const nextActions = decisions
    .slice(0, 5)
    .map((d) => `${d.chosenAction} · ${d.reason}`);

  const report: AetherBossDailyGrowthReport = {
    date: today,
    materialProgress: `样本池 ${material.samplePool} · 数据集候选 ${material.sealedDatasets} · 待审 ${material.pendingReview}`,
    trainingProgress: `${training.activeRun} · 守护 ${training.daemonStatus}`,
    companyProgress: `能力包 ${company.assetCandidates} · 商店草案 ${company.storeDrafts}`,
    systemHealth: overview.failed > 0 ? `存在 ${overview.failed} 个失败任务` : "运行平稳",
    generatedSamples: todayTasks.filter((t) => t.factory === "MATERIAL").length,
    generatedTokens: todayTasks.filter((t) => t.factory === "MATERIAL").length * 12000,
    generatedAssets: todayTasks.filter((t) => t.factory === "COMPANY").length,
    generatedTasks: todayTasks.length,
    completedTasks: todayTasks.filter((t) => t.status === "COMPLETED").length,
    failedTasks: todayTasks.filter((t) => t.status === "FAILED").length,
    recoveredTasks: recoveries.length,
    nextBestActions:
      nextActions.length > 0 ? nextActions : ["继续投喂材料", "封冒烟数据集", "生成训练计划"],
    strategicWarning:
      overview.failed > 0 ? "优先处理失败任务以释放工厂运力" : "建议进入竞争模式抢用户增长",
  };
  saveReport(report);
  return report;
}

// ---- Control ----
export function enableAgent(): void {
  const s = setAgentState({ enabled: true });
  setSchedule({ enabled: true, intervalMinutes: MODE_INTERVAL_MINUTES[s.mode], mode: s.mode });
}
export function disableAgent(): void {
  setAgentState({ enabled: false });
  setSchedule({ enabled: false });
}
export function switchMode(mode: AetherBossMode): void {
  setAgentState({ mode });
  setSchedule({ mode, intervalMinutes: MODE_INTERVAL_MINUTES[mode] });
}

export function getLatestRun(): AetherBossRun | undefined {
  return listRuns()[0];
}
export function getLatestDecision(): AetherBossDecision | undefined {
  return listDecisions()[0];
}
export function getLatestReport(): AetherBossDailyGrowthReport | undefined {
  return listReports()[0];
}

// ---- Heartbeat (browser-only setInterval simulation) ----
let timer: ReturnType<typeof setInterval> | null = null;
export function startHeartbeat(): void {
  if (typeof window === "undefined") return;
  stopHeartbeat();
  const schedule: HeartbeatSchedule = getSchedule();
  if (!schedule.enabled) return;
  const intervalMs = Math.max(1, schedule.intervalMinutes) * 60 * 1000;
  // 首次延迟一个小间隔再跑
  timer = setInterval(() => {
    try {
      runOnce();
    } catch {
      /* 静默 */
    }
  }, intervalMs);
}
export function stopHeartbeat(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// ---- 本地守护接口预留（仅签名占位，未真正发起请求） ----
export const LOCAL_DAEMON_ENDPOINTS = {
  health: "GET /aetherboss/health",
  start: "POST /aetherboss/start",
  stop: "POST /aetherboss/stop",
  runOnce: "POST /aetherboss/run-once",
  status: "GET /aetherboss/status",
  logs: "GET /aetherboss/logs",
  setMode: "POST /aetherboss/set-mode",
  setSchedule: "POST /aetherboss/set-schedule",
} as const;
