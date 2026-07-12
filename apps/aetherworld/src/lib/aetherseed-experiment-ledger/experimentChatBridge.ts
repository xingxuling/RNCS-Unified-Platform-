// AetherSeed Experiment Ledger · Chat 桥
import {
  EXPERIMENT_STATUS_LABEL,
  EXPERIMENT_TARGET_LABEL,
  FAILURE_TYPE_LABEL,
  NEXT_RECOMMENDATION_LABEL,
  type AetherSeedExperiment,
  type ExperimentTargetModel,
} from "./experimentLedgerTypes";
import { listExperiments, listFailures, listNextPlans, listBloodlines } from "./experimentLedgerStore";
import { buildLedgerSnapshot } from "./experimentLedgerRuntime";
import { classifyFailure } from "./experimentNextStepPlanner";
import { EXPERIMENT_LEDGER_SAFETY_ALLOWED, EXPERIMENT_LEDGER_SAFETY_FORBIDDEN } from "./experimentSafetyPolicy";

export type ExperimentChatFocus =
  | "OVERVIEW"
  | "CREATE"
  | "MARK_RUNNING"
  | "MARK_FAILED"
  | "MARK_COMPLETED"
  | "REGISTER_CHECKPOINT"
  | "RECORD_METRICS"
  | "NEXT_PLAN"
  | "BLOODLINE"
  | "RECENT_FAILURES";

const FOCUS_LABEL: Record<ExperimentChatFocus, string> = {
  OVERVIEW: "实验账本总览",
  CREATE: "创建实验",
  MARK_RUNNING: "标记训练中",
  MARK_FAILED: "登记失败",
  MARK_COMPLETED: "登记完成",
  REGISTER_CHECKPOINT: "登记 checkpoint",
  RECORD_METRICS: "登记指标",
  NEXT_PLAN: "下一炉建议",
  BLOODLINE: "模型血统线",
  RECENT_FAILURES: "最近失败",
};

const TRIGGER_KEYWORDS = [
  "实验账本", "实验记录", "experiment ledger",
  "训练失败", "oom", "loss nan", "train loss", "eval loss",
  "checkpoint", "登记 checkpoint", "登记指标",
  "下一炉", "下一轮训练", "下一个实验",
  "模型血统", "aetherseed 血统", "血统线",
  "开始训练了", "训练完成了", "我训练完", "训练完了",
  "创建实验", "新建实验",
];

export function detectExperimentLedgerIntent(raw: string): boolean {
  if (!raw) return false;
  const t = raw.toLowerCase();
  return TRIGGER_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

function pickFocus(raw: string): ExperimentChatFocus {
  const t = raw.toLowerCase();
  if (/血统|bloodline/.test(t)) return "BLOODLINE";
  if (/最近.*失败|哪些.*失败/.test(t)) return "RECENT_FAILURES";
  if (/下一炉|下一个实验|下一轮训练/.test(t)) return "NEXT_PLAN";
  if (/登记.*checkpoint|checkpoint.*路径|登记 checkpoint/.test(t)) return "REGISTER_CHECKPOINT";
  if (/train loss|eval loss|登记.*指标|登记.*loss|帮我登记/.test(t)) return "RECORD_METRICS";
  if (/失败|oom|loss nan|失败报告/.test(t)) return "MARK_FAILED";
  if (/训练完成|训练完了|我训练完|标记完成/.test(t)) return "MARK_COMPLETED";
  if (/开始训练|训练运行中|标记.*运行/.test(t)) return "MARK_RUNNING";
  if (/创建.*实验|新建.*实验|帮我创建/.test(t)) return "CREATE";
  return "OVERVIEW";
}

function pickTarget(raw: string): ExperimentTargetModel | undefined {
  const t = raw.toLowerCase();
  if (/7b/.test(t)) return "AETHERSEED_7B";
  if (/3b/.test(t)) return "AETHERSEED_3B";
  if (/1\.?5b/.test(t)) return "AETHERSEED_1_5B";
  if (/700m/.test(t)) return "AETHERSEED_700M";
  if (/300m/.test(t)) return "AETHERSEED_300M";
  if (/100m/.test(t)) return "AETHERSEED_100M";
  if (/50m/.test(t)) return "AETHERSEED_50M";
  if (/10m/.test(t)) return "AETHERSEED_10M";
  if (/router/.test(t)) return "ROUTER_TINY";
  if (/msl/.test(t)) return "MSL_TINY";
  if (/format/.test(t)) return "FORMAT_TINY";
  return undefined;
}

export interface ChatExperimentLedgerInfo {
  question: string;
  focus: ExperimentChatFocus;
  focusLabel: string;
  summary: string;
  detectedTarget?: { target: ExperimentTargetModel; label: string };
  detectedFailureType?: { type: string; label: string };
  snapshot: {
    total: number;
    readyToRun: number;
    running: number;
    completed: number;
    failed: number;
    evaluated: number;
    checkpointCount: number;
    bloodlineCount: number;
  };
  recentExperiments: { id: string; name: string; target: string; status: string }[];
  recentFailures: { id: string; experimentId: string; type: string; summary: string }[];
  recentNextPlans: { id: string; title: string; recommendationType: string; priority: string }[];
  bloodlines: { modelName: string; generation: string; capability: string[] }[];
  safetyAllowed: string[];
  safetyForbidden: string[];
  workbenchHint: string;
}

function summarize(focus: ExperimentChatFocus, total: number): string {
  if (total === 0 && focus !== "CREATE" && focus !== "OVERVIEW") {
    return "实验账本暂无记录。可从 /system/local-training 先生成本机训练计划，再创建实验记录。";
  }
  switch (focus) {
    case "CREATE": return "可从 /system/local-training 选定训练计划后一键创建实验记录（状态：READY_TO_RUN）。";
    case "MARK_RUNNING": return "请到 /system/experiment-ledger 找到对应实验，点「标记开始」更新为 RUNNING_MANUAL。";
    case "MARK_FAILED": return "已识别失败意图。可在实验详情里粘贴失败日志摘要，系统会自动归因并生成下一炉建议。";
    case "MARK_COMPLETED": return "请到实验详情登记 train_loss / eval_loss，并将状态推进到 COMPLETED_MANUAL。";
    case "REGISTER_CHECKPOINT": return "checkpoint 路径只是用户手动填写的文本，本系统不读取本地磁盘。请在实验详情里手动登记。";
    case "RECORD_METRICS": return "可粘贴训练日志摘要，系统会解析 train_loss / eval_loss / msl / json 等指标。";
    case "NEXT_PLAN": return "根据本轮 metrics / failure 自动生成下一炉建议（SCALE_UP / SMALLER_MODEL / CLEAN_DATA 等）。";
    case "BLOODLINE": return "AetherSeed 血统线：10M → 50M → 100M → 300M → 700M → 1.5B → 3B → 7B。每一代记录关联实验、数据集、checkpoint、能力与弱点。";
    case "RECENT_FAILURES": return "近期失败实验列表与归因摘要。";
    case "OVERVIEW":
    default:
      return "AetherSeed Experiment Ledger：本机/服务器训练 + 评测 + checkpoint + 失败归因 + 下一炉建议 + 模型血统线。完全手动登记，不自动执行训练。";
  }
}

export function buildChatExperimentLedgerInfo(raw: string): ChatExperimentLedgerInfo | undefined {
  if (!detectExperimentLedgerIntent(raw)) return undefined;
  const focus = pickFocus(raw);
  const snap = buildLedgerSnapshot();
  const exps: AetherSeedExperiment[] = listExperiments().slice(0, 6);
  const failures = listFailures().slice(0, 5);
  const nextPlans = listNextPlans().slice(0, 5);
  const bloodlines = listBloodlines();
  const target = pickTarget(raw);
  const failureType = focus === "MARK_FAILED" ? classifyFailure(raw) : undefined;

  return {
    question: raw,
    focus,
    focusLabel: FOCUS_LABEL[focus],
    summary: summarize(focus, snap.totalExperiments),
    detectedTarget: target ? { target, label: EXPERIMENT_TARGET_LABEL[target] } : undefined,
    detectedFailureType: failureType ? { type: failureType, label: FAILURE_TYPE_LABEL[failureType] } : undefined,
    snapshot: {
      total: snap.totalExperiments,
      readyToRun: snap.readyToRun,
      running: snap.running,
      completed: snap.completed,
      failed: snap.failed,
      evaluated: snap.evaluated,
      checkpointCount: snap.checkpointCount,
      bloodlineCount: snap.bloodlineCount,
    },
    recentExperiments: exps.map((e) => ({
      id: e.id,
      name: e.name,
      target: EXPERIMENT_TARGET_LABEL[e.targetModel],
      status: EXPERIMENT_STATUS_LABEL[e.status],
    })),
    recentFailures: failures.map((f) => ({
      id: f.id,
      experimentId: f.experimentId,
      type: FAILURE_TYPE_LABEL[f.failureType],
      summary: f.summary.slice(0, 80),
    })),
    recentNextPlans: nextPlans.map((p) => ({
      id: p.id,
      title: p.title,
      recommendationType: NEXT_RECOMMENDATION_LABEL[p.recommendationType],
      priority: p.priority,
    })),
    bloodlines: bloodlines.map((b) => ({
      modelName: b.modelName,
      generation: b.generation,
      capability: b.capabilitySummary,
    })),
    safetyAllowed: EXPERIMENT_LEDGER_SAFETY_ALLOWED,
    safetyForbidden: EXPERIMENT_LEDGER_SAFETY_FORBIDDEN,
    workbenchHint: "前往 /system/experiment-ledger 完成实验创建、状态登记、metrics 与 checkpoint 录入。",
  };
}
