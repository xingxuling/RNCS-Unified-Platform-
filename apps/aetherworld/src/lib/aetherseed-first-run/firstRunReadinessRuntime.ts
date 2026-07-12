// AetherSeed First Run Readiness · 运行时
// 聚合 dataset / 真实导出 / 安全报告 / 本机训练计划 / 自动训练任务 / 实验账本 / 本地网关 的只读状态，
// 推断「未就绪 / 部分就绪 / 可以点火」。整个流程不触发训练。
import {
  type CheckStatus,
  type FirstRunReadinessSnapshot,
  type ReadinessCheckItem,
  type ReadinessLevel,
} from "./firstRunReadinessTypes";
import {
  buildFirstRunRecommendations,
  buildFirstRunRisks,
} from "./firstRunRecommender";
import { FIRST_RUN_OUTPUT_DIR_ALLOWED } from "./firstRunSafetyPolicy";

import { listTrainingSamples } from "@/lib/aetherseed-dataset/trainingSampleStore";
import { listEvalSamples } from "@/lib/aetherseed-dataset/evalSampleStore";
import { listDatasetVersions } from "@/lib/aetherseed-dataset/datasetBuilder";
import { buildSafetyReport } from "@/lib/aetherseed-dataset/datasetExportSafetyReport";
import { listLocalTrainingBundles } from "@/lib/aetherseed-local-training/localTrainingRuntime";
import {
  listTasks as listAutoTrainingTasks,
  buildAutoTrainingSnapshot,
} from "@/lib/aetherseed-auto-training/autoTrainingTaskStore";
import { listExperiments } from "@/lib/aetherseed-experiment-ledger/experimentLedgerStore";
import { LOCAL_GATEWAY_WHITELIST } from "@/lib/local-execution-gateway/localGatewaySafetyPolicy";

// 用户确认仅放在内存（刷新即重置，避免被绕过）
let USER_CONFIRMED = false;
export function getUserConfirmed(): boolean { return USER_CONFIRMED; }
export function setUserConfirmed(v: boolean) { USER_CONFIRMED = v; }
export function resetFirstRunConfirmation() { USER_CONFIRMED = false; }

export interface GatewayProbe {
  /** /health 是否 OK */
  healthOk: boolean;
  /** 是否检测到连接 */
  connected: boolean;
  /** 最近一次 dry-run 是否通过 */
  dryRunPassed: boolean;
  reason?: string;
}

export function buildFirstRunReadinessSnapshot(
  gatewayProbe?: GatewayProbe,
): FirstRunReadinessSnapshot {
  const samples = listTrainingSamples().filter((s) => s.safetyStatus !== "BLOCK");
  const evals = listEvalSamples().filter((e) => e.safetyStatus !== "BLOCK");
  const datasets = listDatasetVersions();
  const plans = listLocalTrainingBundles();
  const autoTasks = listAutoTrainingTasks();
  const autoSnap = buildAutoTrainingSnapshot();
  const experiments = listExperiments();

  // 1. 训练数据集
  const trainingCheck: ReadinessCheckItem = {
    id: "TRAINING_DATASET",
    label: "训练数据集",
    status: samples.length >= 30
      ? "PASS"
      : samples.length > 0 ? "WARN" : "FAIL",
    detail: samples.length === 0
      ? "尚未生成可用训练样本（不含 BLOCK）。"
      : samples.length < 30
        ? `仅有 ${samples.length} 条可用训练样本，建议至少 30 条用于第一炉验证。`
        : `已有 ${samples.length} 条可用训练样本。`,
    remediationRoute: "/system/intake-forge",
    required: true,
  };

  // 2. 评测数据集
  const evalCheck: ReadinessCheckItem = {
    id: "EVAL_DATASET",
    label: "评测数据集",
    status: evals.length >= 10 ? "PASS" : evals.length > 0 ? "WARN" : "WARN",
    detail: evals.length === 0
      ? "暂无评测样本，第一炉将无法生成评测分数；建议至少准备 10 条。"
      : `已有 ${evals.length} 条评测样本。`,
    remediationRoute: "/system/intake-forge",
    required: false,
  };

  // 3. 真实导出（有数据集版本即认为存在导出能力，真正导出需在数据集页触发）
  const latestDataset = datasets[0];
  const exportCheck: ReadinessCheckItem = {
    id: "REAL_EXPORT",
    label: "真实导出包",
    status: latestDataset ? "PASS" : "FAIL",
    detail: latestDataset
      ? `最新数据集版本：${latestDataset.name} ${latestDataset.version}，可在数据集页生成 JSONL / Manifest。`
      : "尚未构建任何数据集版本，无法生成真实导出包。",
    remediationRoute: "/system/datasets",
    required: true,
  };

  // 4. 安全报告
  let safetyCheck: ReadinessCheckItem;
  if (latestDataset) {
    const report = buildSafetyReport(latestDataset);
    const blocked = report.counters.trainingBlocked + report.counters.evalBlocked;
    const warn = report.counters.trainingWarn;
    safetyCheck = {
      id: "SAFETY_REPORT",
      label: "数据安全报告",
      status: blocked === 0 && warn === 0 ? "PASS" : "WARN",
      detail: `最新数据集 ${latestDataset.safetyStatus}：训练样本 BLOCK ${report.counters.trainingBlocked} / WARN ${warn}，评测 BLOCK ${report.counters.evalBlocked}；BLOCK 样本不会进入训练。`,
      remediationRoute: "/system/datasets",
      required: false,
    };
  } else {
    safetyCheck = {
      id: "SAFETY_REPORT",
      label: "数据安全报告",
      status: "PENDING",
      detail: "尚未构建数据集，无法生成安全报告。",
      remediationRoute: "/system/datasets",
      required: false,
    };
  }

  // 5. 本机训练计划
  const planCheck: ReadinessCheckItem = {
    id: "LOCAL_TRAINING_PLAN",
    label: "本机训练计划",
    status: plans.length > 0 ? "PASS" : "FAIL",
    detail: plans.length === 0
      ? "尚未创建任何本机训练计划（推荐先创建 AetherSeed-10M / Router Tiny）。"
      : `已有 ${plans.length} 份训练计划。`,
    remediationRoute: "/system/local-training",
    required: true,
  };

  // 6. 自动训练任务
  const autoCheck: ReadinessCheckItem = {
    id: "AUTO_TRAINING_TASK",
    label: "自动训练任务",
    status: autoTasks.length > 0 ? "PASS" : "WARN",
    detail: autoTasks.length === 0
      ? "尚未从训练计划创建自动训练任务草案。"
      : `已有 ${autoTasks.length} 个自动训练任务（已生成 dry-run ${autoSnap.dryRunGenerated} / 浏览器侧通过 ${autoSnap.dryRunPassedBrowser} / 网关侧可执行 ${autoSnap.dryRunPassedGateway}）。`,
    remediationRoute: "/system/auto-training",
    required: true,
  };

  // 7. 本地执行网关
  const gatewayCheck: ReadinessCheckItem = {
    id: "GATEWAY_CONNECTED",
    label: "本地执行网关连接",
    status: gatewayProbe?.connected ? "PASS" : "FAIL",
    detail: gatewayProbe?.connected
      ? "本地网关已连接（127.0.0.1:18771）。"
      : (gatewayProbe?.reason ?? "未检测到本地网关连接。第一炉训练前需先启动 local-gateway。"),
    remediationRoute: "/system/local-gateway",
    required: true,
  };

  // 8. /health
  const healthCheck: ReadinessCheckItem = {
    id: "GATEWAY_HEALTH",
    label: "网关 /health",
    status: gatewayProbe?.healthOk ? "PASS" : "FAIL",
    detail: gatewayProbe?.healthOk
      ? "/health 返回 OK，网关身份校验通过。"
      : "网关 /health 未通过或未探测，无法确认本机训练通道。",
    remediationRoute: "/system/local-gateway",
    required: true,
  };

  // 9. dry-run（区分浏览器侧通过 vs 网关已执行通过）
  const browserPassed = autoSnap.dryRunPassedBrowser > 0;
  const gatewayConnected = gatewayProbe?.connected === true;
  const gatewayDryRunPassed = gatewayProbe?.dryRunPassed === true;
  let dryStatus: CheckStatus;
  let dryDetail: string;
  if (gatewayDryRunPassed) {
    dryStatus = "PASS";
    dryDetail = "最近一次本地网关 dry-run 已通过，命令在白名单内。";
  } else if (browserPassed) {
    dryStatus = "PASS";
    dryDetail = `浏览器侧 dry-run 已通过（${autoSnap.dryRunPassedBrowser}/${autoSnap.dryRunGenerated} 个任务命令在白名单、未触发 BLOCK）。${gatewayConnected ? "建议在网关再执行一次复核。" : "真实点火前仍需在本机启动 local-gateway 复核。"}`;
  } else if (autoSnap.dryRunGenerated > 0) {
    dryStatus = "WARN";
    dryDetail = "已生成 dry-run 草案，但命令未通过白名单或存在 BLOCK 原因，请到自动训练器查看。";
  } else if (autoTasks.length > 0) {
    dryStatus = "WARN";
    dryDetail = "已有自动训练任务但尚未生成 dry-run 草案，请在自动训练器对最新任务执行 dry-run。";
  } else {
    dryStatus = "FAIL";
    dryDetail = "尚未创建任何自动训练任务，无法生成 dry-run。";
  }
  const dryRunCheck: ReadinessCheckItem = {
    id: "DRY_RUN_PASSED",
    label: "训练命令 Dry-run",
    status: dryStatus,
    detail: dryDetail,
    remediationRoute: "/system/auto-training",
    required: true,
  };


  // 10. 实验账本记录
  const ledgerCheck: ReadinessCheckItem = {
    id: "EXPERIMENT_RECORD",
    label: "实验账本记录",
    status: experiments.length > 0 ? "PASS" : "WARN",
    detail: experiments.length === 0
      ? "尚未创建实验账本记录，第一炉点火后将无法记录血统。"
      : `已有 ${experiments.length} 条实验记录。`,
    remediationRoute: "/system/experiment-ledger",
    required: false,
  };

  // 11. 输出目录
  const outputDirCheck: ReadinessCheckItem = {
    id: "OUTPUT_DIR_ALLOWED",
    label: "输出目录白名单",
    status: "PASS",
    detail: `仅允许写入：${FIRST_RUN_OUTPUT_DIR_ALLOWED.join("、")}`,
    remediationRoute: "/system/local-gateway",
    required: true,
  };

  // 12. 命令白名单
  const commandCheck: ReadinessCheckItem = {
    id: "COMMAND_WHITELISTED",
    label: "训练命令白名单",
    status: "PASS",
    detail: `白名单命令：${LOCAL_GATEWAY_WHITELIST.slice(0, 6).join("、")}${LOCAL_GATEWAY_WHITELIST.length > 6 ? "…" : ""}`,
    remediationRoute: "/system/local-gateway",
    required: true,
  };

  // 13. 用户确认
  const confirmCheck: ReadinessCheckItem = {
    id: "USER_CONFIRMED",
    label: "用户点火确认",
    status: USER_CONFIRMED ? "PASS" : "PENDING",
    detail: USER_CONFIRMED
      ? "用户已确认第一炉训练（仅本会话有效）。"
      : "尚未确认。第一炉训练必须用户在本页明确确认后才能点火。",
    required: true,
  };

  const checks: ReadinessCheckItem[] = [
    trainingCheck, evalCheck, exportCheck, safetyCheck,
    planCheck, autoCheck, gatewayCheck, healthCheck,
    dryRunCheck, ledgerCheck, outputDirCheck, commandCheck, confirmCheck,
  ];

  // 综合就绪度
  const score = computeScore(checks);
  const blockingReasons = checks
    .filter((c) => c.required && c.status !== "PASS")
    .map((c) => `${c.label}：${c.detail}`);

  const level: ReadinessLevel = blockingReasons.length === 0
    ? "READY_TO_IGNITE"
    : score >= 40 ? "PARTIAL" : "NOT_READY";

  return {
    level,
    score,
    checks,
    recommendations: buildFirstRunRecommendations(),
    risks: buildFirstRunRisks(),
    blockingReasons,
    userConfirmed: USER_CONFIRMED,
    generatedAt: new Date().toISOString(),
  };
}

function computeScore(checks: ReadinessCheckItem[]): number {
  if (checks.length === 0) return 0;
  const weight = (s: CheckStatus) =>
    s === "PASS" ? 1 : s === "WARN" ? 0.6 : s === "PENDING" ? 0.3 : 0;
  const total = checks.reduce((a, c) => a + weight(c.status) * (c.required ? 1.2 : 0.8), 0);
  const max = checks.reduce((a, c) => a + (c.required ? 1.2 : 0.8), 0);
  return Math.round((total / max) * 100);
}
