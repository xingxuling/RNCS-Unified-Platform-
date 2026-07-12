// Aetherworld Autonomous Factory OS · 运行时
import type {
  AutomationLevel,
  AutonomousFactoryTask,
  CompanyFactoryCard,
  FactoryKind,
  FactoryOverview,
  FactoryTaskPriority,
  FactoryTaskType,
  MaterialFactoryCard,
  TrainingFactoryCard,
} from "./autonomousFactoryTypes";
import {
  listFactoryTasks,
  patchFactoryTask,
  saveFactoryTask,
  setFactoryTaskStatus,
} from "./autonomousFactoryStore";
import { countRawCorpusDocuments, sumRawCorpusTokens } from "@/lib/aetherseed-dataset/rawCorpusStore";
import { countLongCorpusChunks, sumLongCorpusTokens } from "@/lib/aetherseed-dataset/longCorpusStore";
import { countTrainingSamples } from "@/lib/aetherseed-dataset/trainingSampleStore";
import { countReviewSamples } from "@/lib/aetherseed-dataset/reviewSampleQueue";
import { listFullCorpusCandidates } from "@/lib/aetherseed-dataset/fullCorpusCandidateStore";
import { listDatasetVersions } from "@/lib/aetherseed-dataset/datasetBuilder";
import {
  listTasks as listAutoTrainingTasks,
  listRuns as listAutoTrainingRuns,
} from "@/lib/aetherseed-auto-training/autoTrainingTaskStore";
import {
  listExperiments,
  listCheckpoints,
} from "@/lib/aetherseed-experiment-ledger/experimentLedgerStore";

function nextId(): string {
  return `aft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

const TYPE_LABEL: Record<FactoryTaskType, string> = {
  INTAKE: "材料投喂",
  DATASET_BUILD: "数据集构建",
  EXPORT: "训练包导出",
  TRAINING_PLAN: "训练计划生成",
  DRY_RUN: "Dry-run 校验",
  TRAINING_RUN: "无人值守训练",
  EVAL: "自动评测",
  LEDGER_WRITE: "实验账本写入",
  CAPABILITY_PACKAGE: "能力包封装",
  STORE_DRAFT: "商店草案生成",
  FEEDBACK_TO_DATASET: "用户反馈回流",
  RECOVERY: "失败恢复",
};

const FACTORY_LABEL: Record<FactoryKind, string> = {
  MATERIAL: "材料工厂",
  TRAINING: "训练工厂",
  COMPANY: "公司工厂",
};

export interface CreateTaskInput {
  factory: FactoryKind;
  taskType: FactoryTaskType;
  title?: string;
  priority?: FactoryTaskPriority;
  automationLevel?: AutomationLevel;
  inputRefs?: string[];
}

export function createFactoryTask(input: CreateTaskInput): AutonomousFactoryTask {
  const t: AutonomousFactoryTask = {
    id: nextId(),
    factory: input.factory,
    taskType: input.taskType,
    title: input.title ?? `${FACTORY_LABEL[input.factory]} · ${TYPE_LABEL[input.taskType]}`,
    status: "WAITING",
    priority: input.priority ?? "P2",
    automationLevel: input.automationLevel ?? "L3",
    inputRefs: input.inputRefs ?? [],
    outputRefs: [],
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return saveFactoryTask(t);
}

export function startTask(id: string) {
  return setFactoryTaskStatus(id, "RUNNING", "任务已进入运行队列");
}
export function pauseTask(id: string) {
  return setFactoryTaskStatus(id, "PAUSED", "用户暂停");
}
export function resumeTask(id: string) {
  return setFactoryTaskStatus(id, "RUNNING", "继续运行");
}
export function completeTask(id: string, output?: string) {
  const t = patchFactoryTask(id, {
    status: "COMPLETED",
    outputRefs: output ? [output] : [],
    notes: ["任务完成"],
  });
  return t;
}
export function failTask(id: string, reason: string, recoveryHint?: string) {
  return patchFactoryTask(id, {
    status: "FAILED",
    failureReason: reason,
    recoveryHint: recoveryHint ?? "回到对应工厂查看日志并重试",
    notes: [`失败：${reason}`],
  });
}
export function retryTask(id: string) {
  return patchFactoryTask(id, {
    status: "RUNNING",
    failureReason: undefined,
    notes: ["从失败状态重试"],
  });
}

export function buildOverview(): FactoryOverview {
  const tasks = listFactoryTasks();
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = tasks.filter((t) => t.createdAt.startsWith(today)).length;
  const running = tasks.filter((t) => t.status === "RUNNING").length;
  const failed = tasks.filter((t) => t.status === "FAILED").length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const generatedAssets = tasks.filter(
    (t) => t.factory === "COMPANY" && t.status === "COMPLETED",
  ).length;
  // 真实链路：以训练样本池规模代表"已生成样本任务"
  const generatedSamples = countTrainingSamples();
  // 真实链路：训练状态来源于 auto-training 任务，而非工厂内部任务
  const autoTasks = listAutoTrainingTasks();
  const runningAutoTask = autoTasks.find((t) => t.status === "RUNNING");
  return {
    todayCount,
    running,
    failed,
    completed,
    generatedAssets,
    generatedSamples,
    trainingStatus: runningAutoTask
      ? `训练中：${runningAutoTask.id.slice(0, 12)}`
      : autoTasks.length > 0
        ? `就绪：${autoTasks.length} 个训练任务`
        : "训练空闲",
    nextSuggestion: suggestNextStepFromChain(),
  };
}

function suggestNextStepFromChain(): string {
  const failed = listFactoryTasks().some((t) => t.status === "FAILED");
  if (failed) return "存在失败任务，建议先处理失败恢复中心";
  const rawDocs = countRawCorpusDocuments();
  const samples = countTrainingSamples();
  const datasets = listDatasetVersions().length;
  const candidates = listFullCorpusCandidates().filter((c) => c.readyForExport).length;
  const autoTasks = listAutoTrainingTasks().length;
  const experiments = listExperiments().length;
  if (rawDocs === 0) return "建议先从材料工厂投喂第一批材料";
  if (samples === 0) return "原始语料已就绪，建议在数据集模块切片为训练样本";
  if (datasets === 0 && candidates === 0) return "样本已就绪，建议封版为数据集版本";
  if (autoTasks === 0) return "数据集就绪，建议在自动训练器创建训练任务";
  if (experiments === 0) return "训练任务已创建，建议执行并写入实验账本";
  return "链路畅通，可继续生成下一批能力包进入公司工厂草案";
}

export function buildMaterialCard(): MaterialFactoryCard {
  // 真实链路：直接读取语料 / 样本 store，与材料工厂上游打通
  const materialTasks = listFactoryTasks().filter((t) => t.factory === "MATERIAL");
  const candidates = listFullCorpusCandidates();
  const sealedCandidates = candidates.filter((c) => c.readyForExport).length;
  return {
    recentIntake: materialTasks[0]?.title ?? (countRawCorpusDocuments() > 0 ? `原始文档 ${countRawCorpusDocuments()} 份` : "暂无投喂"),
    samplePool: countTrainingSamples(),
    longCorpusTokens: sumLongCorpusTokens() + sumRawCorpusTokens(),
    pendingReview: countReviewSamples(),
    sealedDatasets: listDatasetVersions().length + sealedCandidates,
    exportableBundles: sealedCandidates,
    nextStep:
      sealedCandidates > 0
        ? "已有可导出候选，建议直接导出训练包"
        : countTrainingSamples() > 0
          ? "样本池就绪，建议封版当前候选为 FullCorpus"
          : "建议先在投喂炉补充原始材料",
  };
}

export function buildTrainingCard(daemonReady: boolean): TrainingFactoryCard {
  // 真实链路：从 auto-training / experiment-ledger 读取
  const autoTasks = listAutoTrainingTasks();
  const autoRuns = listAutoTrainingRuns();
  const experiments = listExperiments();
  const checkpoints = listCheckpoints();
  const runningTask = autoTasks.find((t) => t.status === "RUNNING");
  const latestRun = autoRuns[autoRuns.length - 1];
  const latestCkpt = checkpoints[checkpoints.length - 1];
  const latestExp = experiments[experiments.length - 1];
  return {
    targetModel: latestExp?.targetModel ?? "AetherSeed-300M-LoRA-v0.1",
    activeRun: runningTask ? `${runningTask.id.slice(0, 12)} · ${runningTask.status}` : "无运行任务",
    daemonStatus: daemonReady ? "READY" : "OFFLINE",
    latestCheckpoint: latestCkpt ? `${latestCkpt.checkpointName} · ${latestCkpt.status}` : "—",
    latestLog: latestRun ? `${latestRun.id.slice(0, 10)}/logs/train.log` : "—",
    latestExperiment: latestExp ? `${latestExp.name} · ${latestExp.status}` : "—",
    nextPlan:
      experiments.length === 0 && autoTasks.length > 0
        ? "已有训练任务，建议执行 dry-run 并写入实验账本"
        : "提升中长样本比例至 35%，将 maxSteps × 1.5",
    unattended: daemonReady && autoTasks.length > 0,
  };
}

export function buildCompanyCard(): CompanyFactoryCard {
  const tasks = listFactoryTasks().filter((t) => t.factory === "COMPANY");
  return {
    assetCandidates: tasks.filter((t) => t.taskType === "CAPABILITY_PACKAGE").length,
    userUploads: 0,
    storeDrafts: tasks.filter((t) => t.taskType === "STORE_DRAFT").length,
    publishablePages: tasks.filter(
      (t) => t.taskType === "STORE_DRAFT" && t.status === "COMPLETED",
    ).length,
    pendingReview: tasks.filter((t) => t.status === "NEEDS_CONFIRMATION").length,
    revenueRoute: "私有商店草案 → 内部演示 → 客户邀请试用",
    nextStep: "把最近完成的 Prompt 包封装为商店草案",
  };
}

export function summarizeTaskType(t: FactoryTaskType): string {
  return TYPE_LABEL[t];
}
export function summarizeFactory(f: FactoryKind): string {
  return FACTORY_LABEL[f];
}
