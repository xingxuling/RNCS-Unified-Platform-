// Aetherworld Local AGI · 运行时
import {
  buildCompanyCard,
  buildMaterialCard,
  buildOverview,
  buildTrainingCard,
  createFactoryTask,
} from "@/lib/aetherworld-autonomous-factory/autonomousFactoryRuntime";
import { listFactoryTasks } from "@/lib/aetherworld-autonomous-factory/autonomousFactoryStore";
import { scanExternalRadar } from "./externalDataRadar";
import { absorbAllPending } from "./feedbackAbsorber";
import { scanAndPlanDevelopment } from "./developmentFactory";
import {
  getAgiState,
  getHeartbeat,
  listDecisions,
  listDevTasks,
  listFeedback,
  listReports,
  listRuns,
  listSignals,
  saveDecision,
  saveReport,
  saveRun,
  setAgiState,
  setHeartbeat,
} from "./localAgiStore";
import type {
  LocalAGIDailyReport,
  LocalAGIDecision,
  LocalAGIFactory,
  LocalAGIMode,
  LocalAGIObservation,
  LocalAGIPriority,
  LocalAGIRun,
} from "./localAgiTypes";
import { LOCAL_AGI_INTERVAL_MIN } from "./localAgiTypes";

function nid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// ---- 观察 ----
export function observe(): LocalAGIObservation {
  const tasks = listFactoryTasks();
  const material = buildMaterialCard();
  const training = buildTrainingCard(false);
  const company = buildCompanyCard();
  const today = new Date().toISOString().slice(0, 10);
  const feedback = listFeedback();
  return {
    materialPool: material.samplePool,
    sealedDatasets: material.sealedDatasets,
    trainingRunning: training.activeRun !== "无运行任务",
    companyDrafts: company.storeDrafts,
    failedTasks: tasks.filter((t) => t.status === "FAILED").length,
    todayTaskCount: tasks.filter((t) => t.createdAt.startsWith(today)).length,
    pendingFeedback: feedback.filter((f) => !f.absorbed).length,
    externalSignals: listSignals().length,
    devDrafts: listDevTasks().length,
  };
}

export function summarizeObservation(o: LocalAGIObservation): string {
  return [
    `样本池 ${o.materialPool}`,
    `数据集 ${o.sealedDatasets}`,
    o.trainingRunning ? "训练中" : "训练空闲",
    `公司草案 ${o.companyDrafts}`,
    o.failedTasks > 0 ? `失败 ${o.failedTasks}` : "无失败",
    `今日任务 ${o.todayTaskCount}`,
    `待吸收反馈 ${o.pendingFeedback}`,
    `外界信号 ${o.externalSignals}`,
    `开发草案 ${o.devDrafts}`,
  ].join(" · ");
}

// ---- 决策 ----
interface Draft {
  factory: LocalAGIFactory;
  task: string;
  priority: LocalAGIPriority;
  reason: string;
  expectedValue: string;
  requiredConfirmation: boolean;
}

function pickByMode(mode: LocalAGIMode, o: LocalAGIObservation): Draft {
  if (mode === "SLEEP") {
    return {
      factory: "SYSTEM_HEALTH",
      task: "保持休眠，仅记录状态",
      priority: "P3",
      reason: "休眠模式不创建任务",
      expectedValue: "保留状态以便随时唤醒",
      requiredConfirmation: false,
    };
  }
  if (o.failedTasks > 0) {
    return {
      factory: "SYSTEM_HEALTH",
      task: "恢复失败任务",
      priority: "P0",
      reason: `检测到 ${o.failedTasks} 个失败任务`,
      expectedValue: "释放工厂运力",
      requiredConfirmation: false,
    };
  }
  if (mode === "DEVELOPMENT") {
    return {
      factory: "DEVELOPMENT",
      task: "扫描系统缺口并生成 Lovable 提示词",
      priority: "P1",
      reason: "开发模式优先推进系统迭代",
      expectedValue: "新增开发任务、Lovable 提示词草案",
      requiredConfirmation: false,
    };
  }
  if (mode === "RESEARCH") {
    return {
      factory: "MATERIAL",
      task: "运行外界数据雷达并写入材料工厂",
      priority: "P1",
      reason: "研究模式优先搜集外界信号",
      expectedValue: "新增可投喂材料包",
      requiredConfirmation: false,
    };
  }
  if (mode === "COMPETITION") {
    if (o.materialPool < 30) {
      return {
        factory: "MATERIAL",
        task: "继续投喂材料",
        priority: "P1",
        reason: "竞争模式数据先行",
        expectedValue: "扩大样本池",
        requiredConfirmation: false,
      };
    }
    if (o.companyDrafts < 3) {
      return {
        factory: "COMPANY",
        task: "生成商店草案与客户材料",
        priority: "P1",
        reason: "竞争模式优先抢用户",
        expectedValue: "新增商店草案",
        requiredConfirmation: false,
      };
    }
    return {
      factory: "TRAINING",
      task: "生成下一炉训练计划",
      priority: "P1",
      reason: "竞争模式推进模型能力",
      expectedValue: "推进 AetherSeed 血统",
      requiredConfirmation: false,
    };
  }
  // FACTORY_CONTROL / PLAN / OBSERVE
  if (o.pendingFeedback > 0) {
    return {
      factory: "DEVELOPMENT",
      task: "吸收待处理反馈",
      priority: "P1",
      reason: "存在待吸收反馈",
      expectedValue: "转为开发任务 / 训练样本",
      requiredConfirmation: false,
    };
  }
  if (o.materialPool < 20) {
    return {
      factory: "MATERIAL",
      task: "继续投喂材料",
      priority: "P1",
      reason: "样本池偏少",
      expectedValue: "支撑后续训练",
      requiredConfirmation: false,
    };
  }
  if (o.sealedDatasets === 0) {
    return {
      factory: "MATERIAL",
      task: "封冒烟数据集",
      priority: "P1",
      reason: "尚无封版数据集",
      expectedValue: "得到首个数据集候选",
      requiredConfirmation: false,
    };
  }
  if (!o.trainingRunning) {
    return {
      factory: "TRAINING",
      task: "生成下一炉训练计划草案",
      priority: "P2",
      reason: "训练工厂空闲",
      expectedValue: "形成训练计划草案",
      requiredConfirmation: false,
    };
  }
  return {
    factory: "SYSTEM_HEALTH",
    task: "生成下一步建议",
    priority: "P3",
    reason: "系统运行平稳",
    expectedValue: "保持节奏",
    requiredConfirmation: false,
  };
}

const FACTORY_TO_AF: Partial<Record<LocalAGIFactory, "MATERIAL" | "TRAINING" | "COMPANY">> = {
  MATERIAL: "MATERIAL",
  TRAINING: "TRAINING",
  COMPANY: "COMPANY",
};

export interface RunOnceResult {
  run: LocalAGIRun;
  decision: LocalAGIDecision;
  generatedOutputs: string[];
}

export function runOnce(): RunOnceResult {
  const state = getAgiState();
  const mode = state.mode;
  const o = observe();
  const summary = summarizeObservation(o);
  const draft = pickByMode(mode, o);

  const runId = nid("run");
  const decisionId = nid("dec");
  const generatedOutputs: string[] = [];

  const onlyDraft = mode === "OBSERVE" || mode === "SLEEP" || mode === "PLAN";

  // 模式专属副作用
  if (mode === "RESEARCH") {
    const sigs = scanExternalRadar();
    generatedOutputs.push(`外界信号 ${sigs.length} 条`);
  }
  if (mode === "DEVELOPMENT" || draft.factory === "DEVELOPMENT") {
    const devs = scanAndPlanDevelopment({
      brokenRoutes: 0,
      unlinkedChat: 0,
      pendingPFItems: 0,
      uxComplaints: o.pendingFeedback,
    });
    generatedOutputs.push(`开发草案 ${devs.length} 条`);
  }
  if (o.pendingFeedback > 0) {
    const absorbed = absorbAllPending(listFeedback());
    if (absorbed.length > 0) generatedOutputs.push(`吸收反馈 ${absorbed.length} 条`);
  }

  // 创建无人工厂任务（材料 / 训练 / 公司可映射）
  const afKind = FACTORY_TO_AF[draft.factory];
  if (afKind && !onlyDraft) {
    const t = createFactoryTask({
      factory: afKind,
      taskType:
        draft.factory === "MATERIAL"
          ? "INTAKE"
          : draft.factory === "TRAINING"
          ? "TRAINING_PLAN"
          : "CAPABILITY_PACKAGE",
      title: `[专属 AGI] ${draft.task}`,
      priority: draft.priority,
      automationLevel: mode === "FACTORY_CONTROL" ? "L3" : "L2",
    });
    generatedOutputs.push(`工厂任务 ${t.id}`);
  }

  const decision: LocalAGIDecision = {
    id: decisionId,
    runId,
    mode,
    observation: summary,
    chosenFactory: draft.factory,
    chosenTask: draft.task,
    priority: draft.priority,
    reason: draft.reason,
    expectedValue: draft.expectedValue,
    requiredConfirmation: draft.requiredConfirmation,
    generatedOutputs,
    createdAt: new Date().toISOString(),
  };
  saveDecision(decision);

  const run: LocalAGIRun = {
    id: runId,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    mode,
    observation: summary,
    decisionIds: [decisionId],
    notes: [`模式：${mode}`, onlyDraft ? "只输出草案" : "可推进低风险动作"],
  };
  saveRun(run);

  // 更新心跳与状态
  const hb = getHeartbeat();
  const intervalMinutes = LOCAL_AGI_INTERVAL_MIN[mode];
  const next = new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString();
  setHeartbeat({
    lastRunAt: run.startedAt,
    nextRunAt: next,
    runCount: hb.runCount + 1,
    intervalMinutes,
    mode,
    currentFocus: draft.task,
  });
  setAgiState({
    lastRunAt: run.startedAt,
    nextRunAt: next,
    todayGrowthScore: computeGrowthScore(),
  });

  return { run, decision, generatedOutputs };
}

// ---- 今日增长报告 ----
function computeGrowthScore(): number {
  const today = new Date().toISOString().slice(0, 10);
  const tasks = listFactoryTasks().filter((t) => t.createdAt.startsWith(today));
  const decisions = listDecisions().filter((d) => d.createdAt.startsWith(today));
  const signals = listSignals().filter((s) => s.createdAt.startsWith(today));
  const fb = listFeedback().filter((f) => f.createdAt.startsWith(today) && f.absorbed);
  const devs = listDevTasks().filter((d) => d.createdAt.startsWith(today));
  return tasks.length * 2 + decisions.length + signals.length + fb.length + devs.length;
}

export function buildDailyReport(): LocalAGIDailyReport {
  const today = new Date().toISOString().slice(0, 10);
  const tasks = listFactoryTasks();
  const todayTasks = tasks.filter((t) => t.createdAt.startsWith(today));
  const overview = buildOverview();
  const signals = listSignals().filter((s) => s.createdAt.startsWith(today));
  const fb = listFeedback().filter((f) => f.createdAt.startsWith(today) && f.absorbed);
  const devs = listDevTasks().filter((d) => d.createdAt.startsWith(today));
  const report: LocalAGIDailyReport = {
    date: today,
    newSamples: todayTasks.filter((t) => t.factory === "MATERIAL").length,
    newTokens: todayTasks.filter((t) => t.factory === "MATERIAL").length * 12000,
    newTasks: todayTasks.length,
    newAssets: todayTasks.filter((t) => t.factory === "COMPANY").length,
    newTrainingPlans: todayTasks.filter((t) => t.factory === "TRAINING").length,
    recoveredTasks: 0,
    externalSignals: signals.length,
    absorbedFeedback: fb.length,
    developmentDrafts: devs.length,
    growthScore: computeGrowthScore(),
    nextBestActions: [
      "继续投喂材料",
      "封冒烟数据集",
      "生成下一炉训练计划",
      "封装商店草案",
      "把反馈转成训练样本",
    ],
    strategicNote:
      overview.failed > 0
        ? "优先处理失败任务以释放工厂运力"
        : "建议进入竞争模式抢用户增长",
  };
  saveReport(report);
  return report;
}

// ---- 控制 ----
export function enableAgi() {
  const s = setAgiState({ enabled: true });
  setHeartbeat({
    enabled: true,
    mode: s.mode,
    intervalMinutes: LOCAL_AGI_INTERVAL_MIN[s.mode],
  });
}
export function disableAgi() {
  setAgiState({ enabled: false });
  setHeartbeat({ enabled: false });
}
export function switchMode(mode: LocalAGIMode) {
  setAgiState({ mode });
  setHeartbeat({ mode, intervalMinutes: LOCAL_AGI_INTERVAL_MIN[mode] });
}

export function getLatestRun(): LocalAGIRun | undefined {
  return listRuns()[0];
}
export function getLatestDecision(): LocalAGIDecision | undefined {
  return listDecisions()[0];
}
export function getLatestReport(): LocalAGIDailyReport | undefined {
  return listReports()[0];
}

// ---- 心跳调度 ----
let timer: ReturnType<typeof setInterval> | null = null;
export function startHeartbeat(): void {
  if (typeof window === "undefined") return;
  stopHeartbeat();
  const hb = getHeartbeat();
  if (!hb.enabled) return;
  const ms = Math.max(1, hb.intervalMinutes) * 60 * 1000;
  timer = setInterval(() => {
    try {
      runOnce();
    } catch {
      /* 静默 */
    }
  }, ms);
}
export function stopHeartbeat(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// ---- 本地守护接口预留 ----
export const LOCAL_AGI_DAEMON_ENDPOINTS = {
  health: "GET /local-agi/health",
  start: "POST /local-agi/start",
  stop: "POST /local-agi/stop",
  runOnce: "POST /local-agi/run-once",
  status: "GET /local-agi/status",
  logs: "GET /local-agi/logs",
  setMode: "POST /local-agi/set-mode",
  setSchedule: "POST /local-agi/set-schedule",
} as const;
