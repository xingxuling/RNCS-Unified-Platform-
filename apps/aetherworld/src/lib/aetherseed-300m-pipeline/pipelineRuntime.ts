// AetherSeed 300M One-Click Training Pipeline · 运行时编排器
// - 聚合 dataset / export / training plan / experiment ledger / workflow / auto training / gateway 状态
// - 可自动「补齐」缺失的草案（数据集 / 训练计划 / 实验记录 / 工作流 / 自动训练任务 / dry-run）
// - 真正执行训练（POST /training/run）必须由 igniteRealRun() 显式调用，且依赖会话内存的用户确认
// - 用户确认只放在内存，刷新失效，无法被系统自动伪造

import {
  type PipelineAutoFillResult,
  type PipelineCheckItem,
  type PipelineCheckStatus,
  type PipelineGatewayState,
  type PipelineLatestExperimentInfo,
  type PipelineNextStepHint,
  type PipelinePreview,
  type PipelinePreviewCommand,
  type PipelineSnapshot,
  type PipelineStage,
  PIPELINE_STAGE_LABEL,
} from "./pipelineTypes";
import {
  PIPELINE_OUTPUT_DIR_WHITELIST,
  PIPELINE_INPUT_SOURCE_WHITELIST,
} from "./pipelineSafetyPolicy";

import {
  AETHERSEED_300M_DATASET_NAME,
  AETHERSEED_300M_MODEL_NAME,
} from "@/lib/aetherseed-300m/aetherSeed300mMainLine";

import { listTrainingSamples } from "@/lib/aetherseed-dataset/trainingSampleStore";
import { listEvalSamples } from "@/lib/aetherseed-dataset/evalSampleStore";
import {
  buildDatasetVersion,
  listDatasetVersions,
} from "@/lib/aetherseed-dataset/datasetBuilder";
import { buildSafetyReport } from "@/lib/aetherseed-dataset/datasetExportSafetyReport";
import {
  listLocalTrainingBundles,
  planLocalTraining,
  type LocalTrainingBundle,
} from "@/lib/aetherseed-local-training/localTrainingRuntime";
import {
  listExperiments,
  patchExperiment,
  setExperimentStatus,
  saveCheckpoint,
} from "@/lib/aetherseed-experiment-ledger/experimentLedgerStore";
import {
  createExperimentFromLocalTrainingPlan,
  generateNextPlan,
  recordFailureAndPlan,
} from "@/lib/aetherseed-experiment-ledger/experimentLedgerRuntime";
import {
  listWorkflows,
} from "@/lib/aetherseed-training-workflow/trainingWorkflowStore";
import { createTrainingWorkflow } from "@/lib/aetherseed-training-workflow/trainingWorkflowRuntime";
import {
  listTasks as listAutoTrainingTasks,
  getDryRun as getAutoDryRun,
  getCommands as getAutoCommands,
} from "@/lib/aetherseed-auto-training/autoTrainingTaskStore";
import {
  createAutoTrainingTask,
  performDryRun as performAutoDryRun,
} from "@/lib/aetherseed-auto-training/autoTrainingRuntime";
import {
  pingGateway,
  gatewayDryRun,
  gatewayRunTraining,
  gatewayGetStatus,
  gatewayGetLogs,
  gatewayCancel,
} from "@/lib/local-execution-gateway/localGatewayClient";
import { LOCAL_GATEWAY_WHITELIST } from "@/lib/local-execution-gateway/localGatewaySafetyPolicy";
import { nextExperimentId } from "@/lib/aetherseed-experiment-ledger/experimentLedgerTypes";

// ====== 会话级状态（不持久化） ======

let USER_CONFIRMED = false;
export function getPipelineUserConfirmed(): boolean { return USER_CONFIRMED; }
export function setPipelineUserConfirmed(v: boolean) { USER_CONFIRMED = v; }
export function resetPipelineUserConfirmation() { USER_CONFIRMED = false; }

/** 当前正在运行的 runId（由 /training/run 返回，仅供本会话查询日志 / 停止） */
let CURRENT_RUN_ID: string | undefined;
let CURRENT_EXPERIMENT_ID: string | undefined;

export function getPipelineCurrentRunId(): string | undefined { return CURRENT_RUN_ID; }
export function getPipelineCurrentExperimentId(): string | undefined { return CURRENT_EXPERIMENT_ID; }

/** 最近一次本地网关探测缓存（避免每次 snapshot 都打网络） */
let GATEWAY_CACHE: PipelineGatewayState = { connected: false, healthOk: false };
let LAST_GATEWAY_PROBE_AT = 0;

export async function probeGateway(force = false): Promise<PipelineGatewayState> {
  const now = Date.now();
  if (!force && now - LAST_GATEWAY_PROBE_AT < 3000) return GATEWAY_CACHE;
  LAST_GATEWAY_PROBE_AT = now;
  const r = await pingGateway();
  GATEWAY_CACHE = {
    connected: r.ok,
    healthOk: r.ok,
    reason: r.reason,
    baseUrl: r.health ? `http://${r.health.host}:${r.health.port}` : undefined,
  };
  return GATEWAY_CACHE;
}

export function getCachedGatewayState(): PipelineGatewayState { return GATEWAY_CACHE; }

// ====== 选择「最适合 300M」的数据集 / 训练计划 / 实验 ======

function pickLatest300mDataset() {
  const all = listDatasetVersions();
  // 优先名字带 300M 的；否则取最近一个 MIXED / SFT / EVAL
  return (
    all.find((d) => /300m|私有/i.test(d.name)) ??
    all.find((d) => d.datasetType === "SFT" || d.datasetType === "MIXED") ??
    all[0]
  );
}

function pickLatest300mPlan(): LocalTrainingBundle | undefined {
  const all = listLocalTrainingBundles();
  return (
    all.find((b) => b.plan.targetModel === "AETHERSEED_300M_PRIVATE") ??
    all[0]
  );
}

function pickLatest300mExperiment() {
  return (
    listExperiments().find(
      (e) => (e.targetModel as string) === "AETHERSEED_300M_PRIVATE",
    ) ?? listExperiments()[0]
  );
}

function pickLatest300mWorkflow() {
  const all = listWorkflows();
  return (
    all.find((w) => /300m|私有/i.test(w.title) || w.targetModel.includes("300M")) ??
    all[0]
  );
}

function pickLatest300mAutoTrainingTask() {
  const plan = pickLatest300mPlan();
  const all = listAutoTrainingTasks();
  if (plan) {
    const matched = all.find((t) => t.localTrainingPlanId === plan.plan.id);
    if (matched) return matched;
  }
  return all[0];
}

// ====== 检查项构造 ======

function buildChecks(gateway: PipelineGatewayState): PipelineCheckItem[] {
  const samples = listTrainingSamples().filter((s) => s.safetyStatus !== "BLOCK");
  const blockedSamples = listTrainingSamples().filter((s) => s.safetyStatus === "BLOCK");
  const evals = listEvalSamples().filter((e) => e.safetyStatus !== "BLOCK");
  const dataset = pickLatest300mDataset();
  const planBundle = pickLatest300mPlan();
  const experiment = pickLatest300mExperiment();
  const workflow = pickLatest300mWorkflow();
  const autoTask = pickLatest300mAutoTrainingTask();
  const dry = autoTask ? getAutoDryRun(autoTask.id) : undefined;

  const checks: PipelineCheckItem[] = [];

  checks.push({
    id: "RAW_MATERIAL",
    label: "原始素材（投喂炉）",
    status: samples.length > 0 ? "PASS" : "FAIL",
    detail: samples.length > 0
      ? `投喂炉已沉淀 ${samples.length} 条可用样本（不含 BLOCK）。`
      : "投喂炉尚未沉淀任何可用样本，无法构建 300M 数据集。",
    required: true,
    autoFillable: false,
    remediationRoute: "/system/intake-forge",
  });

  checks.push({
    id: "TRAINING_DATASET",
    label: "训练数据集",
    status: samples.length >= 300 ? "PASS" : samples.length >= 30 ? "WARN" : "FAIL",
    detail: samples.length >= 300
      ? `已有 ${samples.length} 条训练样本（满足 300M 第一炉建议下限）。`
      : samples.length >= 30
        ? `仅 ${samples.length} 条训练样本：可先小批闭环，正式 300M 训练建议 ≥ 300 条。`
        : `仅 ${samples.length} 条训练样本，远低于 300M 第一炉建议。`,
    required: true,
    autoFillable: false,
    remediationRoute: "/system/intake-forge",
  });

  checks.push({
    id: "EVAL_DATASET",
    label: "评测数据集",
    status: evals.length >= 30 ? "PASS" : evals.length > 0 ? "WARN" : "WARN",
    detail: evals.length > 0
      ? `已有 ${evals.length} 条评测样本。`
      : "尚无评测样本；第一炉评测分数将无法生成。",
    required: false,
    autoFillable: false,
    remediationRoute: "/system/intake-forge",
  });

  checks.push({
    id: "SAFETY_REPORT",
    label: "数据安全报告（BLOCK = 0）",
    status: blockedSamples.length === 0 ? "PASS" : "WARN",
    detail: blockedSamples.length === 0
      ? "未检测到 BLOCK 样本。"
      : `存在 ${blockedSamples.length} 条 BLOCK 样本，将被自动剔除、不进入训练。`,
    required: false,
    autoFillable: false,
    remediationRoute: "/system/datasets",
  });

  checks.push({
    id: "LICENSE",
    label: "语料许可（创始人允许私有训练）",
    status: dataset ? "PASS" : "WARN",
    detail: dataset
      ? "数据集来源限定为创始人允许的私有训练材料；不训练来源不明 / 未授权 / 第三方版权材料。"
      : "尚未构建数据集，无法显式校验语料许可。",
    required: false,
    autoFillable: false,
    remediationRoute: "/system/datasets",
  });

  checks.push({
    id: "REAL_EXPORT",
    label: "真实导出包（JSONL + Manifest + 安全报告）",
    status: dataset ? "PASS" : "FAIL",
    detail: dataset
      ? `最新数据集：${dataset.name} ${dataset.version}（可在数据集页生成 train.jsonl / eval.jsonl / safety_report.json）。`
      : "尚未构建数据集版本，无法生成真实导出包。",
    required: true,
    autoFillable: true,
    remediationRoute: "/system/datasets",
  });

  checks.push({
    id: "TRAINING_PLAN",
    label: "300M 本机训练计划",
    status: planBundle?.plan.targetModel === "AETHERSEED_300M_PRIVATE" ? "PASS" : planBundle ? "WARN" : "FAIL",
    detail: planBundle?.plan.targetModel === "AETHERSEED_300M_PRIVATE"
      ? `已有 300M 训练计划：${planBundle.plan.name}（${planBundle.config.trainingConfig.precision} / ckpt 每 ${planBundle.config.trainingConfig.saveEverySteps} 步）。`
      : planBundle
        ? `当前最新训练计划目标不是 300M（${planBundle.plan.name}）。`
        : "尚未创建 300M 训练计划。",
    required: true,
    autoFillable: true,
    remediationRoute: "/system/local-training",
  });

  checks.push({
    id: "EXPERIMENT_RECORD",
    label: "实验账本记录",
    status: experiment ? "PASS" : "WARN",
    detail: experiment
      ? `已有实验记录：${experiment.name}（${experiment.status}）。`
      : "尚未创建实验账本记录。",
    required: false,
    autoFillable: true,
    remediationRoute: "/system/experiment-ledger",
  });

  checks.push({
    id: "TRAINING_WORKFLOW",
    label: "训练工作流",
    status: workflow ? "PASS" : "WARN",
    detail: workflow
      ? `已有训练工作流：${workflow.title}（${workflow.overallStatus}）。`
      : "尚未创建训练工作流。",
    required: false,
    autoFillable: true,
    remediationRoute: "/system/training-workflows",
  });

  checks.push({
    id: "AUTO_TRAINING_TASK",
    label: "自动训练任务",
    status: autoTask ? "PASS" : "FAIL",
    detail: autoTask
      ? `已有自动训练任务：${autoTask.name}（${autoTask.status}）。`
      : "尚未创建自动训练任务。",
    required: true,
    autoFillable: true,
    remediationRoute: "/system/auto-training",
  });

  const dryRunBlocked = dry && dry.blockedReasons.length > 0;
  checks.push({
    id: "DRY_RUN",
    label: "Dry-run（命令预览 + 白名单 + 未触发 BLOCK）",
    status: dry && !dryRunBlocked ? "PASS" : dry ? "FAIL" : "FAIL",
    detail: dry
      ? dryRunBlocked
        ? `Dry-run 被拦截：${dry.blockedReasons.join("；")}`
        : `Dry-run 通过（风险=${dry.estimatedRisk}，环境=${dry.environmentStatus}）。`
      : "尚未对最新自动训练任务执行 dry-run。",
    required: true,
    autoFillable: true,
    remediationRoute: "/system/auto-training",
  });

  checks.push({
    id: "GATEWAY_CONNECTED",
    label: "本地执行网关连接",
    status: gateway.connected ? "PASS" : "FAIL",
    detail: gateway.connected
      ? `本地网关已连接：${gateway.baseUrl ?? "127.0.0.1:18771"}`
      : (gateway.reason ?? "未检测到本地网关；请在本机启动 local-gateway。"),
    required: true,
    autoFillable: false,
    remediationRoute: "/system/local-gateway",
  });

  checks.push({
    id: "GATEWAY_HEALTH",
    label: "网关 /health",
    status: gateway.healthOk ? "PASS" : "FAIL",
    detail: gateway.healthOk
      ? "/health 通过，网关身份校验 OK。"
      : "/health 未通过或未探测。",
    required: true,
    autoFillable: false,
    remediationRoute: "/system/local-gateway",
  });

  checks.push({
    id: "COMMAND_WHITELIST",
    label: "训练命令白名单",
    status: "PASS",
    detail: `白名单：${LOCAL_GATEWAY_WHITELIST.slice(0, 4).join("、")}${LOCAL_GATEWAY_WHITELIST.length > 4 ? "…" : ""}（仅这些命令可执行）`,
    required: true,
    autoFillable: false,
    remediationRoute: "/system/local-gateway",
  });

  checks.push({
    id: "OUTPUT_DIR_WHITELIST",
    label: "输出目录白名单",
    status: "PASS",
    detail: `仅允许写入：${PIPELINE_OUTPUT_DIR_WHITELIST.join("、")}`,
    required: true,
    autoFillable: false,
  });

  checks.push({
    id: "USER_CONFIRMED",
    label: "用户最终确认",
    status: USER_CONFIRMED ? "PASS" : "PENDING",
    detail: USER_CONFIRMED
      ? "用户已确认开始训练 AetherSeed 300M（仅本会话有效）。"
      : "尚未确认。仅在前置全部通过后才能勾选确认；刷新页面即失效。",
    required: true,
    autoFillable: false,
  });

  return checks;
}

// ====== 阶段推断 ======

function inferStage(checks: PipelineCheckItem[]): PipelineStage {
  if (CURRENT_RUN_ID) return "RUNNING";
  const requiredFail = checks.filter(
    (c) => c.required && (c.status === "FAIL" || c.status === "PENDING")
  );

  // RUNNING / COMPLETED / FAILED 状态需借助实验账本
  const exp = pickLatest300mExperiment();
  if (exp?.status === "COMPLETED_MANUAL" || exp?.status === "EVALUATED") return "COMPLETED";
  if (exp?.status === "FAILED_MANUAL") return "FAILED";

  // 核心 6 项：素材 / 数据集 / 真实导出 / 训练计划 / 自动训练任务 / dry-run
  const coreIds = new Set([
    "RAW_MATERIAL", "TRAINING_DATASET", "REAL_EXPORT",
    "TRAINING_PLAN", "AUTO_TRAINING_TASK",
  ]);
  const coreFail = checks.some(
    (c) => coreIds.has(c.id) && c.status !== "PASS" && c.required,
  );
  if (coreFail) return "NOT_READY";

  const dry = checks.find((c) => c.id === "DRY_RUN");
  if (!dry || dry.status !== "PASS") return "PREPARING";

  const gw = checks.find((c) => c.id === "GATEWAY_CONNECTED");
  const health = checks.find((c) => c.id === "GATEWAY_HEALTH");
  if (!gw || gw.status !== "PASS" || !health || health.status !== "PASS") {
    return "READY_FOR_DRYRUN";
  }
  if (!USER_CONFIRMED) return "WAITING_CONFIRM";
  // 已确认但还没真的调用 ignite —— 仍然停在 WAITING_CONFIRM
  if (!CURRENT_RUN_ID) return "WAITING_CONFIRM";
  void requiredFail; // mark used
  return "RUNNING";
}

function computeScore(checks: PipelineCheckItem[]): number {
  if (!checks.length) return 0;
  const weight = (s: PipelineCheckStatus) =>
    s === "PASS" ? 1 : s === "WARN" ? 0.6 : s === "PENDING" ? 0.3 : 0;
  const total = checks.reduce((a, c) => a + weight(c.status) * (c.required ? 1.2 : 0.8), 0);
  const max = checks.reduce((a, c) => a + (c.required ? 1.2 : 0.8), 0);
  return Math.round((total / max) * 100);
}

// ====== 预览构造 ======

function buildPreview(): PipelinePreview | undefined {
  const autoTask = pickLatest300mAutoTrainingTask();
  if (!autoTask) return undefined;
  const cmds = getAutoCommands(autoTask.id);
  const dry = getAutoDryRun(autoTask.id);
  if (!cmds.length) return undefined;
  const previewCommands: PipelinePreviewCommand[] = cmds.map((c) => ({
    label: c.commandType,
    executable: c.executable,
    args: c.args,
    workingDirectory: c.workingDirectory,
    whitelist: c.whitelistStatus === "PASS" ? "PASS" : "FAIL",
  }));
  const planBundle = pickLatest300mPlan();
  const planId = planBundle?.plan.id ?? autoTask.localTrainingPlanId;
  const outputDir = `${PIPELINE_OUTPUT_DIR_WHITELIST[0]}${planId}/`;
  const logDir = `${PIPELINE_OUTPUT_DIR_WHITELIST[2]}${planId}/`;
  const checkpointDir = `${PIPELINE_OUTPUT_DIR_WHITELIST[1]}${planId}/`;
  const risks = dry?.warnings ?? [];
  const whitelistPassed = previewCommands.every((c) => c.whitelist === "PASS");
  return {
    commands: previewCommands,
    inputs: PIPELINE_INPUT_SOURCE_WHITELIST.slice(),
    outputDir,
    logDir,
    checkpointDir,
    risks,
    whitelistPassed,
    needsUserConfirmation: true,
  };
}

function buildLatestExperimentInfo(): PipelineLatestExperimentInfo | undefined {
  const exp = pickLatest300mExperiment();
  if (!exp) return undefined;
  return {
    id: exp.id,
    name: exp.name,
    status: exp.status,
    runId: CURRENT_RUN_ID,
  };
}

function buildNextSteps(stage: PipelineStage, checks: PipelineCheckItem[]): PipelineNextStepHint[] {
  const out: PipelineNextStepHint[] = [];
  if (stage === "NOT_READY" || stage === "PREPARING") {
    const failing = checks.filter((c) => c.required && c.status !== "PASS");
    for (const c of failing.slice(0, 3)) {
      out.push({
        label: `处理：${c.label}`,
        detail: c.detail,
        route: c.remediationRoute,
      });
    }
    out.push({
      label: "一键自动补齐缺失项",
      detail: "由系统生成数据集 / 导出 / 训练计划 / 实验记录 / 工作流 / 自动训练任务 / dry-run 草案。",
    });
    return out;
  }
  if (stage === "READY_FOR_DRYRUN") {
    out.push({
      label: "启动本地执行网关 + /health",
      detail: "在本机终端执行：cd local-gateway && npm install && npm run local-gateway。",
      route: "/system/local-gateway",
    });
    return out;
  }
  if (stage === "WAITING_CONFIRM") {
    out.push({
      label: "最终用户确认",
      detail: USER_CONFIRMED
        ? "已确认，可点击「我确认开始训练 AetherSeed 300M」。"
        : "请勾选并按下「我确认开始训练 AetherSeed 300M」。系统不会替你点火。",
    });
    return out;
  }
  if (stage === "RUNNING") {
    out.push({
      label: "查看训练日志",
      detail: "本页训练中状态显示最近 stderr / checkpoint / 已运行时间。",
    });
    out.push({
      label: "如需停止",
      detail: "点击「停止训练」按钮调用本地网关 /training/cancel。",
    });
    return out;
  }
  if (stage === "COMPLETED") {
    out.push({
      label: "查看 checkpoint",
      detail: "实验账本已登记 checkpoint，可继续 Ollama 接入准备。",
      route: "/system/experiment-ledger",
    });
    out.push({
      label: "生成下一炉建议",
      detail: "点击下方「生成下一炉建议」记录到实验账本。",
    });
    return out;
  }
  if (stage === "FAILED") {
    out.push({
      label: "查看失败原因",
      detail: "下方训练状态卡片显示 stderr 与原因摘要。",
    });
    out.push({
      label: "生成下一炉建议",
      detail: "失败已写入实验账本失败报告，可生成下一炉建议。",
    });
    return out;
  }
  return out;
}

// ====== 主 Snapshot ======

export interface BuildSnapshotOptions {
  /** 是否触发新的网关探测；默认使用 3 秒缓存 */
  probe?: boolean;
}

export async function buildPipelineSnapshot(opts: BuildSnapshotOptions = {}): Promise<PipelineSnapshot> {
  const gateway = opts.probe ? await probeGateway(true) : await probeGateway(false);
  return buildPipelineSnapshotSync(gateway);
}

/** 同步快照：不打网络，用上一次缓存的网关状态 */
export function buildPipelineSnapshotSync(
  gatewayOverride?: PipelineGatewayState,
): PipelineSnapshot {
  const gateway = gatewayOverride ?? GATEWAY_CACHE;
  const checks = buildChecks(gateway);
  const stage = inferStage(checks);
  const score = computeScore(checks);
  const preview = buildPreview();
  const latestExperiment = buildLatestExperimentInfo();
  const blockingReasons = checks
    .filter((c) => c.required && c.status !== "PASS")
    .map((c) => `${c.label}：${c.detail}`);
  const canIgnite =
    blockingReasons.length === 0 && USER_CONFIRMED && (preview?.whitelistPassed ?? false);
  const nextSteps = buildNextSteps(stage, checks);
  return {
    stage,
    stageLabel: PIPELINE_STAGE_LABEL[stage],
    score,
    canIgnite,
    userConfirmed: USER_CONFIRMED,
    checks,
    blockingReasons,
    gateway,
    preview,
    latestExperiment,
    nextSteps,
    generatedAt: new Date().toISOString(),
  };
}

// ====== 自动补齐：仅生成草案，不真实执行 ======

export async function autoFillMissing(): Promise<PipelineAutoFillResult> {
  const result: PipelineAutoFillResult = {
    performedDryRun: false,
    blockedReasons: [],
    notes: [],
  };

  // 0. 校验：必须有原始素材
  const samples = listTrainingSamples().filter((s) => s.safetyStatus !== "BLOCK");
  if (samples.length === 0) {
    result.blockedReasons.push("投喂炉尚无可用样本：无法自动构建 300M 数据集。请先到投喂炉沉淀样本。");
    return result;
  }

  // 1. 数据集（按需创建 300M 私有数据集草案）
  let dataset = pickLatest300mDataset();
  if (!dataset) {
    dataset = buildDatasetVersion({
      name: AETHERSEED_300M_DATASET_NAME,
      datasetType: "MIXED",
      description: "AetherSeed 300M 私有模型第一炉草案（仅创始人允许的私有训练材料）。",
    });
    result.createdDatasetId = dataset.id;
    result.notes.push(`已创建数据集草案：${dataset.name} ${dataset.version}`);
  }

  // 2. 安全报告（不阻断，仅记录）
  const report = buildSafetyReport(dataset);
  if (report.counters.trainingBlocked > 0) {
    result.notes.push(
      `数据集存在 ${report.counters.trainingBlocked} 条 BLOCK 样本，已自动剔除、不进入训练。`,
    );
  }

  // 3. 训练计划（300M / CPT + SFT）
  let bundle = pickLatest300mPlan();
  if (!bundle || bundle.plan.targetModel !== "AETHERSEED_300M_PRIVATE") {
    bundle = planLocalTraining({
      name: `${AETHERSEED_300M_MODEL_NAME} · 第一炉计划`,
      target: "AETHERSEED_300M_PRIVATE",
      mode: "CONTINUED_PRETRAIN_PLUS_SFT",
      dataset,
    });
    result.createdPlanId = bundle.plan.id;
    result.notes.push(`已创建 300M 训练计划：${bundle.plan.name}`);
  }

  // 4. 实验账本记录
  let exp = pickLatest300mExperiment();
  if (!exp || (exp.targetModel as string) !== "AETHERSEED_300M_PRIVATE") {
    exp = createExperimentFromLocalTrainingPlan(bundle.plan, {
      name: `${AETHERSEED_300M_MODEL_NAME} · 第一炉`,
    });
    result.createdExperimentId = exp.id;
    result.notes.push(`已创建实验记录：${exp.name}`);
  }

  // 5. 训练工作流
  let workflow = pickLatest300mWorkflow();
  if (!workflow) {
    workflow = createTrainingWorkflow({
      title: `${AETHERSEED_300M_MODEL_NAME} · 一键训练流水线`,
      targetModel: "AETHERSEED_300M",
      intent: "AetherSeed 300M 私有模型第一炉：数据 → 导出 → 计划 → 实验 → 自动训练 → 网关 → 用户确认 → 训练 → 日志 → checkpoint → 下一炉 → Ollama 准备",
    });
    result.createdWorkflowId = workflow.id;
    result.notes.push(`已创建训练工作流：${workflow.title}`);
  }

  // 6. 自动训练任务
  let autoTask = pickLatest300mAutoTrainingTask();
  if (!autoTask || autoTask.localTrainingPlanId !== bundle.plan.id) {
    autoTask = createAutoTrainingTask({
      bundle,
      source: "LOCAL_TRAINING_PLAN",
      level: "L2_CONFIRM_TO_RUN",
      workflowRunId: workflow?.id,
      experimentId: exp.id,
      hasBlockedSamples: report.counters.trainingBlocked > 0,
    });
    result.createdAutoTrainingTaskId = autoTask.id;
    result.notes.push(`已创建自动训练任务：${autoTask.name}`);
  }

  // 7. Dry-run（仅命令预览 + 白名单 + 风险评估）
  const dry = performAutoDryRun(
    autoTask.id,
    bundle,
    report.counters.trainingBlocked > 0,
  );
  result.performedDryRun = true;
  result.dryRunPassed = dry.dryRun.blockedReasons.length === 0;
  if (!result.dryRunPassed) {
    result.blockedReasons.push(
      `Dry-run 被拦截：${dry.dryRun.blockedReasons.join("；")}`,
    );
  } else {
    result.notes.push(
      `Dry-run 通过（风险=${dry.dryRun.estimatedRisk}，环境=${dry.dryRun.environmentStatus}）。`,
    );
  }

  // 8. 探测本地网关（不阻断）
  await probeGateway(true);

  return result;
}

// ====== 用户确认 / 点火 / 训练状态 ======

export interface IgnitePreflight {
  canIgnite: boolean;
  reasons: string[];
}

export function checkIgnitePreflight(): IgnitePreflight {
  const snap = buildPipelineSnapshotSync();
  return { canIgnite: snap.canIgnite, reasons: snap.blockingReasons };
}

/** 真正调用本地执行网关 /training/run；严格依赖用户确认 + dry-run + 白名单 */
export async function igniteRealRun(): Promise<{ ok: boolean; runId?: string; reason?: string }> {
  if (!USER_CONFIRMED) {
    return { ok: false, reason: "用户尚未确认，拒绝点火。" };
  }
  const gateway = await probeGateway(true);
  if (!gateway.connected || !gateway.healthOk) {
    return { ok: false, reason: "本地执行网关未连接 / /health 未通过。" };
  }
  const snap = buildPipelineSnapshotSync(gateway);
  if (!snap.canIgnite || !snap.preview) {
    return { ok: false, reason: snap.blockingReasons[0] ?? "前置条件未全部通过。" };
  }
  const autoTask = pickLatest300mAutoTrainingTask();
  const cmds = autoTask ? getAutoCommands(autoTask.id) : [];
  // 仅取「TRAIN」类命令；找不到则取最后一条作为主训练命令
  const trainCmd = cmds.find((c) => c.commandType === "PYTHON_TRAIN") ?? cmds[cmds.length - 1];
  if (!trainCmd) {
    return { ok: false, reason: "缺少训练命令。" };
  }
  if (trainCmd.whitelistStatus !== "PASS") {
    return { ok: false, reason: `训练命令未通过白名单：${trainCmd.reason}` };
  }

  // 再次远端 dry-run，防止白名单/工作目录策略漂移
  const remoteDry = await gatewayDryRun({
    taskId: autoTask?.id ?? "P3M",
    workingDirectory: trainCmd.workingDirectory,
    executable: trainCmd.executable,
    args: trainCmd.args,
  });
  if (!remoteDry || !remoteDry.canRun) {
    return {
      ok: false,
      reason: `网关 dry-run 拒绝：${remoteDry?.blockedReasons.join("；") ?? "未知原因"}`,
    };
  }

  // 真实调用
  const resp = await gatewayRunTraining({
    taskId: autoTask?.id ?? "P3M",
    workingDirectory: trainCmd.workingDirectory,
    executable: trainCmd.executable,
    args: trainCmd.args,
    userConfirmed: true,
  });
  if (!resp.ok || !resp.runId) {
    return { ok: false, reason: resp.reason ?? "本地网关拒绝执行。" };
  }
  CURRENT_RUN_ID = resp.runId;
  const exp = pickLatest300mExperiment();
  CURRENT_EXPERIMENT_ID = exp?.id;
  if (exp) {
    setExperimentStatus(exp.id, "RUNNING_MANUAL");
    patchExperiment(exp.id, { notes: `runId=${resp.runId}` });
  }
  return { ok: true, runId: resp.runId };
}

export interface RunTickResult {
  status: string;
  exitCode: number | null;
  startedAt?: string;
  endedAt?: string;
  recentLines: string[];
  isFinal: boolean;
}

/** 训练中状态轮询：拉取 /training/status + 最近日志 */
export async function tickRunStatus(): Promise<RunTickResult | undefined> {
  if (!CURRENT_RUN_ID) return undefined;
  const status = await gatewayGetStatus(CURRENT_RUN_ID);
  const logs = await gatewayGetLogs(CURRENT_RUN_ID);
  const recent = (logs?.logs ?? []).slice(-8).map((l) => `[${l.level}] ${l.line}`);
  const result: RunTickResult = {
    status: status?.status ?? "UNKNOWN",
    exitCode: status?.exitCode ?? null,
    startedAt: status?.startedAt,
    endedAt: status?.endedAt ?? undefined,
    recentLines: recent,
    isFinal: false,
  };
  if (status && (status.status === "COMPLETED" || status.status === "FAILED" || status.status === "CANCELLED" || status.status === "TIMEOUT")) {
    result.isFinal = true;
    await finalizeRun(status.status, recent);
  }
  return result;
}

async function finalizeRun(
  finalStatus: "COMPLETED" | "FAILED" | "CANCELLED" | "TIMEOUT",
  recentLines: string[],
) {
  const expId = CURRENT_EXPERIMENT_ID;
  if (!expId) {
    CURRENT_RUN_ID = undefined;
    return;
  }
  if (finalStatus === "COMPLETED") {
    setExperimentStatus(expId, "COMPLETED_MANUAL");
    // 登记 checkpoint
    saveCheckpoint({
      id: nextExperimentId("CKPT"),
      experimentId: expId,
      checkpointName: `final-${CURRENT_RUN_ID ?? "run"}`,
      modelFormat: "SAFETENSORS",
      status: "REGISTERED_MANUAL",
      sizeMb: 0,
      checkpointPath: `${PIPELINE_OUTPUT_DIR_WHITELIST[1]}<runId=${CURRENT_RUN_ID}>/final/`,
      notes: "",
      createdAt: new Date().toISOString(),
    });
    // 生成下一炉建议
    try { generateNextPlan(expId); } catch { /* ignore */ }
  } else {
    setExperimentStatus(expId, "FAILED_MANUAL");
    try {
      recordFailureAndPlan(
        expId,
        `网关上报最终状态：${finalStatus}。最近日志：${recentLines.slice(-3).join(" / ")}`,
      );
    } catch { /* ignore */ }
  }
  CURRENT_RUN_ID = undefined;
}

export async function stopCurrentRun(): Promise<boolean> {
  if (!CURRENT_RUN_ID) return false;
  const ok = await gatewayCancel(CURRENT_RUN_ID);
  if (ok && CURRENT_EXPERIMENT_ID) {
    setExperimentStatus(CURRENT_EXPERIMENT_ID, "FAILED_MANUAL");
    try {
      recordFailureAndPlan(CURRENT_EXPERIMENT_ID, "用户在本页手动停止训练。");
    } catch { /* ignore */ }
  }
  CURRENT_RUN_ID = undefined;
  return ok;
}

/** 训练完成 / 失败后：手动触发生成下一炉建议（不真实开新训练） */
export function generateNextFurnacePlan(): { ok: boolean; reason?: string } {
  const exp = pickLatest300mExperiment();
  if (!exp) return { ok: false, reason: "尚无 300M 实验记录。" };
  try {
    generateNextPlan(exp.id);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}
