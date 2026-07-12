// AetherSeed First Run Validation v0.1
// 第一炉实测验收：把 13 项检查清单按用户心智折叠成 7 步线性流程，
// 并产出「点火前最后确认清单」。本文件不触发训练 / 不调用网关执行 / 不读取本地文件。
import {
  buildFirstRunReadinessSnapshot,
  getUserConfirmed,
  type GatewayProbe,
} from "./firstRunReadinessRuntime";
import {
  CHECK_STATUS_LABEL,
  type CheckId,
  type CheckStatus,
  type FirstRunReadinessSnapshot,
  type ReadinessCheckItem,
  type FirstRunRecommendation,
} from "./firstRunReadinessTypes";
import { buildFirstRunRecommendations } from "./firstRunRecommender";

export type ValidationStepId =
  | "DATASET"
  | "EXPORT"
  | "PLAN"
  | "GATEWAY"
  | "DRY_RUN"
  | "LEDGER"
  | "FINAL_CONFIRM";

export const VALIDATION_STEP_TITLE: Record<ValidationStepId, string> = {
  DATASET: "第一步 · 检查数据集",
  EXPORT: "第二步 · 检查真实导出",
  PLAN: "第三步 · 检查训练计划",
  GATEWAY: "第四步 · 检查本地执行网关",
  DRY_RUN: "第五步 · 检查 Dry-run",
  LEDGER: "第六步 · 检查实验账本",
  FINAL_CONFIRM: "第七步 · 最后确认",
};

export interface ValidationStepSubItem {
  label: string;
  status: CheckStatus;
  note: string;
}

export interface ValidationStep {
  id: ValidationStepId;
  order: number;
  title: string;
  goal: string;
  /** 综合该步骤的状态：所有 required 子项必须 PASS 才 PASS */
  status: CheckStatus;
  /** 该步骤是否阻断点火（required 子项未通过） */
  blocking: boolean;
  subItems: ValidationStepSubItem[];
  jumpRoute?: string;
  jumpLabel?: string;
  /** 本步骤未通过时的提示 */
  hint?: string;
}

export interface FinalChecklistItem {
  label: string;
  ok: boolean;
  note: string;
}

export interface FirstRunValidationFlow {
  steps: ValidationStep[];
  /** 第一个 status !== PASS 的步骤；若全通过则等于 FINAL_CONFIRM */
  currentStepId: ValidationStepId;
  /** 是否所有阻断项均已 PASS 且用户已确认 */
  canIgnite: boolean;
  /** 用户确认状态（仅会话内存，不持久化） */
  userConfirmed: boolean;
  /** 点火前最后确认清单 */
  finalChecklist: FinalChecklistItem[];
  /** 第一炉首推模型（强制 Router Tiny） */
  primaryRecommendation: FirstRunRecommendation;
  generatedAt: string;
}

// ============== 内部工具 ==============

function pickCheck(snap: FirstRunReadinessSnapshot, id: CheckId): ReadinessCheckItem | undefined {
  return snap.checks.find((c) => c.id === id);
}

function toSubItem(c: ReadinessCheckItem | undefined, fallbackLabel: string): ValidationStepSubItem {
  if (!c) {
    return { label: fallbackLabel, status: "PENDING", note: "尚未生成该检查项。" };
  }
  return { label: c.label, status: c.status, note: c.detail };
}

/** 合并子项状态：任一 required FAIL → FAIL；任一 WARN → WARN；全 PASS → PASS */
function reduceStatus(
  items: ValidationStepSubItem[],
  requiredLabels: string[],
): { status: CheckStatus; blocking: boolean } {
  let blocking = false;
  let hasFail = false;
  let hasWarn = false;
  let hasPending = false;
  for (const it of items) {
    if (it.status === "FAIL") {
      hasFail = true;
      if (requiredLabels.includes(it.label)) blocking = true;
    } else if (it.status === "WARN") {
      hasWarn = true;
    } else if (it.status === "PENDING") {
      hasPending = true;
      if (requiredLabels.includes(it.label)) blocking = true;
    }
  }
  if (hasFail) return { status: "FAIL", blocking };
  if (hasPending) return { status: "PENDING", blocking };
  if (hasWarn) return { status: "WARN", blocking };
  return { status: "PASS", blocking: false };
}

// ============== 主构造函数 ==============

export function buildFirstRunValidationFlow(
  gatewayProbe?: GatewayProbe,
): FirstRunValidationFlow {
  const snap = buildFirstRunReadinessSnapshot(gatewayProbe);

  // Step 1：数据集（训练样本 + 评测样本 + BLOCK = 0）
  const training = toSubItem(pickCheck(snap, "TRAINING_DATASET"), "训练数据集");
  const evalItem = toSubItem(pickCheck(snap, "EVAL_DATASET"), "评测数据集");
  const safety = toSubItem(pickCheck(snap, "SAFETY_REPORT"), "数据安全报告");
  const datasetItems: ValidationStepSubItem[] = [training, evalItem, safety];
  const datasetReq = ["训练数据集"]; // 评测可缺、安全报告 WARN 容忍
  const datasetReduced = reduceStatus(datasetItems, datasetReq);

  const datasetStep: ValidationStep = {
    id: "DATASET",
    order: 1,
    title: VALIDATION_STEP_TITLE.DATASET,
    goal: "确认有训练样本、评测样本，且无 BLOCK 数据进入第一炉。",
    status: datasetReduced.status,
    blocking: datasetReduced.blocking,
    subItems: datasetItems,
    jumpRoute: "/system/intake-forge",
    jumpLabel: "前往投喂炉 / 数据集",
    hint: datasetReduced.blocking
      ? "请先到投喂炉补足训练样本，或在数据集页清理 BLOCK 数据。"
      : undefined,
  };

  // Step 2：真实导出（数据集版本 + 安全报告 + manifest 由数据集页生成）
  const exportItem = toSubItem(pickCheck(snap, "REAL_EXPORT"), "真实导出包");
  const exportItems: ValidationStepSubItem[] = [exportItem, safety];
  const exportReduced = reduceStatus(exportItems, ["真实导出包"]);

  const exportStep: ValidationStep = {
    id: "EXPORT",
    order: 2,
    title: VALIDATION_STEP_TITLE.EXPORT,
    goal: "确认已生成 JSONL / Manifest / 安全报告（真实导出包）。",
    status: exportReduced.status,
    blocking: exportReduced.blocking,
    subItems: exportItems,
    jumpRoute: "/system/datasets",
    jumpLabel: "前往数据集页生成导出",
    hint: exportReduced.blocking
      ? "请到数据集页对最新版本执行「真实导出」，得到 JSONL + manifest + 安全报告。"
      : undefined,
  };

  // Step 3：训练计划（本机训练计划）
  const plan = toSubItem(pickCheck(snap, "LOCAL_TRAINING_PLAN"), "本机训练计划");
  const planItems: ValidationStepSubItem[] = [plan];
  const planReduced = reduceStatus(planItems, ["本机训练计划"]);

  const planStep: ValidationStep = {
    id: "PLAN",
    order: 3,
    title: VALIDATION_STEP_TITLE.PLAN,
    goal: "确认已有 AetherSeed 300M 私有模型训练计划（主线）。",
    status: planReduced.status,
    blocking: planReduced.blocking,
    subItems: planItems,
    jumpRoute: "/system/local-training",
    jumpLabel: "前往本机训练",
    hint: planReduced.blocking
      ? "请在本机训练页创建第一炉计划：AetherSeed 300M 私有模型（CPT + SFT）。"
      : undefined,
  };

  // Step 4：本地执行网关（connected + /health）
  const gw = toSubItem(pickCheck(snap, "GATEWAY_CONNECTED"), "本地执行网关连接");
  const health = toSubItem(pickCheck(snap, "GATEWAY_HEALTH"), "网关 /health");
  const gwItems: ValidationStepSubItem[] = [gw, health];
  const gwReduced = reduceStatus(gwItems, ["本地执行网关连接", "网关 /health"]);

  const gatewayStep: ValidationStep = {
    id: "GATEWAY",
    order: 4,
    title: VALIDATION_STEP_TITLE.GATEWAY,
    goal: "确认本地网关已连接、/health 通过。未连接时不显示「可以点火」。",
    status: gwReduced.status,
    blocking: gwReduced.blocking,
    subItems: gwItems,
    jumpRoute: "/system/local-gateway",
    jumpLabel: "前往本地执行网关",
    hint: gwReduced.blocking
      ? "请在本机终端执行：cd local-gateway && npm install && npm run local-gateway，启动后回到本页点「检查本地网关 /health」。"
      : undefined,
  };

  // Step 5：dry-run（命令预览 + 白名单 + 输出目录）
  const dry = toSubItem(pickCheck(snap, "DRY_RUN_PASSED"), "训练命令 Dry-run");
  const cmd = toSubItem(pickCheck(snap, "COMMAND_WHITELISTED"), "训练命令白名单");
  const outDir = toSubItem(pickCheck(snap, "OUTPUT_DIR_ALLOWED"), "输出目录白名单");
  const auto = toSubItem(pickCheck(snap, "AUTO_TRAINING_TASK"), "自动训练任务");
  const dryItems: ValidationStepSubItem[] = [auto, dry, cmd, outDir];
  const dryReduced = reduceStatus(dryItems, ["训练命令 Dry-run", "训练命令白名单", "输出目录白名单"]);

  const dryRunStep: ValidationStep = {
    id: "DRY_RUN",
    order: 5,
    title: VALIDATION_STEP_TITLE.DRY_RUN,
    goal: "确认自动训练器已生成命令预览、白名单通过、未触发 BLOCK。",
    status: dryReduced.status,
    blocking: dryReduced.blocking,
    subItems: dryItems,
    jumpRoute: "/system/auto-training",
    jumpLabel: "前往自动训练器",
    hint: dryReduced.blocking
      ? "请在自动训练器对最新任务执行 dry-run，确认命令在白名单内且未触发 BLOCK。"
      : undefined,
  };

  // Step 6：实验账本
  const ledger = toSubItem(pickCheck(snap, "EXPERIMENT_RECORD"), "实验账本记录");
  const ledgerItems: ValidationStepSubItem[] = [ledger];
  // 实验账本不阻断点火（snapshot 中 required=false），但仍提醒
  const ledgerReduced = reduceStatus(ledgerItems, []);

  const ledgerStep: ValidationStep = {
    id: "LEDGER",
    order: 6,
    title: VALIDATION_STEP_TITLE.LEDGER,
    goal: "确认已创建第一炉实验记录，用于记录模型血统与 checkpoint。",
    status: ledgerReduced.status,
    blocking: false,
    subItems: ledgerItems,
    jumpRoute: "/system/experiment-ledger",
    jumpLabel: "前往实验账本",
    hint: ledgerReduced.status !== "PASS"
      ? "建议在实验账本创建第一炉记录草案，避免训练完成后无法追溯。"
      : undefined,
  };

  // Step 7：最后确认（用户确认 + 仅会话内存）
  const confirm = toSubItem(pickCheck(snap, "USER_CONFIRMED"), "用户点火确认");
  const confirmItems: ValidationStepSubItem[] = [confirm];
  const confirmReduced = reduceStatus(confirmItems, ["用户点火确认"]);

  const finalStep: ValidationStep = {
    id: "FINAL_CONFIRM",
    order: 7,
    title: VALIDATION_STEP_TITLE.FINAL_CONFIRM,
    goal: "用户必须本页明确确认；确认仅会话内存有效，刷新即失效，系统无法自动伪造。",
    status: confirmReduced.status,
    blocking: confirmReduced.blocking,
    subItems: confirmItems,
    hint: confirmReduced.blocking
      ? "前 6 步全部通过后，仍需用户在本页点击「我已确认第一炉点火」。"
      : undefined,
  };

  const steps: ValidationStep[] = [
    datasetStep, exportStep, planStep, gatewayStep, dryRunStep, ledgerStep, finalStep,
  ];

  const firstUnfinished = steps.find((s) => s.status !== "PASS");
  const currentStepId: ValidationStepId = firstUnfinished?.id ?? "FINAL_CONFIRM";

  const hardBlockers = steps.filter((s) => s.blocking);
  const canIgnite = hardBlockers.length === 0 && getUserConfirmed();

  // 当前主线：AetherSeed 300M 私有模型；从 recommender 顺序取首位（已锁定为 300M）。
  const recs = buildFirstRunRecommendations();
  const router = recs.find((r) => r.modelId === "AETHERSEED_300M_PRIVATE") ?? recs[0];

  // 点火前最后确认清单（只读、不替用户勾选）
  const finalChecklist: FinalChecklistItem[] = [
    {
      label: `第一炉模型 = ${router.modelName}`,
      ok: true,
      note: "当前主线收束为 AetherSeed 300M 私有模型；不公开 / 不开源 / 不上传。",
    },
    {
      label: `第一炉样本量建议 ≤ ${router.recommendedSampleCap} 条`,
      ok: true,
      note: "第一炉禁止全量数据，请先用小样本跑通端到端闭环。",
    },
    {
      label: "本地执行网关已连接 + /health 通过",
      ok: gatewayStep.status === "PASS",
      note: "未连接网关时绝不显示「可以点火」。",
    },
    {
      label: "Dry-run 通过、命令在白名单",
      ok: dryRunStep.status === "PASS",
      note: "不允许绕过 dry-run。",
    },
    {
      label: "输出目录在白名单内",
      ok: outDir.status === "PASS",
      note: "仅允许写入 ./aether-training 等白名单目录。",
    },
    {
      label: "训练样本无 BLOCK 数据",
      ok: training.status !== "FAIL",
      note: "BLOCK 样本不会进入训练。",
    },
    {
      label: "实验账本已就绪（建议）",
      ok: ledgerStep.status === "PASS",
      note: "便于训练完成后写回血统记录。",
    },
    {
      label: "用户已点击「我已确认第一炉点火」",
      ok: getUserConfirmed(),
      note: "确认仅会话内存有效，刷新即失效。",
    },
  ];

  return {
    steps,
    currentStepId,
    canIgnite,
    userConfirmed: getUserConfirmed(),
    finalChecklist,
    primaryRecommendation: router,
    generatedAt: new Date().toISOString(),
  };
}

/** Chat / 其他模块快查：当前距离点火还差哪些条件（required & 未 PASS） */
export function listFirstRunBlockers(gatewayProbe?: GatewayProbe): string[] {
  const flow = buildFirstRunValidationFlow(gatewayProbe);
  const out: string[] = [];
  for (const s of flow.steps) {
    if (!s.blocking) continue;
    const failed = s.subItems
      .filter((i) => i.status !== "PASS")
      .map((i) => `${i.label}（${CHECK_STATUS_LABEL[i.status]}）`);
    out.push(`${s.title}：${failed.join("、")}`);
  }
  return out;
}
