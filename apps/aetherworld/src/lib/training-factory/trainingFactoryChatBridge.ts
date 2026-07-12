// 训练工厂计算法 · Chat Bridge
import { runTrainingFactoryCalculus } from "./trainingFactoryRuntime";
import type { TrainingFactoryCalculusReport } from "./trainingFactoryTypes";

export type TFCChatFocus =
  | "OVERVIEW"
  | "FLOW"
  | "QUADRANT"
  | "RECURSIVE"
  | "COST"
  | "WEIGHT"
  | "NEXT_GENERATION"
  | "FORGE_ASSIGN";

export interface ChatTrainingFactoryCalculusInfo {
  question: string;
  focus: TFCChatFocus;
  focusLabel: string;
  summary: string;
  report: TrainingFactoryCalculusReport;
  highlightedQuadrant?: "SKELETON" | "MUSCLE" | "BLOOD" | "NERVE";
}

const FOCUS_LABEL: Record<TFCChatFocus, string> = {
  OVERVIEW: "计算法总览",
  FLOW: "15 步流程",
  QUADRANT: "四象补法",
  RECURSIVE: "递归自举",
  COST: "成本计算法",
  WEIGHT: "数据权重",
  NEXT_GENERATION: "下一代计划",
  FORGE_ASSIGN: "炉火分配",
};

const TRIGGERS = [
  "训练工厂", "training factory", "训练计算法", "工厂计算法",
  "下一代模型", "下一代 aetherseed", "下一代计划",
  "数据加权", "数据权重", "样本权重", "重加权",
  "训练成本", "训练费用", "成本计算法",
  "本机慢跑", "本机训练", "服务器爆发", "炉火分配",
  "递归自举", "反哺训练", "模型反哺",
  "训练流程", "训练管线",
  "缺哪一象", "缺骨架", "缺肌肉", "缺血液", "缺神经",
];

export function detectTrainingFactoryIntent(raw: string): boolean {
  if (!raw) return false;
  const lower = raw.toLowerCase();
  return TRIGGERS.some((k) => lower.includes(k.toLowerCase()));
}

function pickFocus(raw: string): { focus: TFCChatFocus; quadrant?: ChatTrainingFactoryCalculusInfo["highlightedQuadrant"] } {
  const t = raw.toLowerCase();
  if (/(下一代|next generation|next-gen|路线)/.test(t)) return { focus: "NEXT_GENERATION" };
  if (/(成本|费用|moneycost|时间成本|注意力)/.test(t)) return { focus: "COST" };
  if (/(数据加权|数据权重|样本权重|重加权|datasetweight)/.test(t)) return { focus: "WEIGHT" };
  if (/(递归|反哺|自举)/.test(t)) return { focus: "RECURSIVE" };
  if (/(本机|服务器|gpu|炉火|分配)/.test(t)) return { focus: "FORGE_ASSIGN" };
  if (/缺骨架|skeleton/.test(t)) return { focus: "QUADRANT", quadrant: "SKELETON" };
  if (/缺肌肉|muscle/.test(t)) return { focus: "QUADRANT", quadrant: "MUSCLE" };
  if (/缺血液|blood/.test(t)) return { focus: "QUADRANT", quadrant: "BLOOD" };
  if (/缺神经|nerve/.test(t)) return { focus: "QUADRANT", quadrant: "NERVE" };
  if (/四象|补法/.test(t)) return { focus: "QUADRANT" };
  if (/流程|管线|15 步|十五步/.test(t)) return { focus: "FLOW" };
  return { focus: "OVERVIEW" };
}

export function buildChatTrainingFactoryCalculusInfo(
  raw: string,
): ChatTrainingFactoryCalculusInfo | undefined {
  if (!raw || !detectTrainingFactoryIntent(raw)) return undefined;
  const report = runTrainingFactoryCalculus();
  const picked = pickFocus(raw);

  let summary = "训练工厂是把语料种子编译成模型血统的计算法。";
  if (picked.focus === "NEXT_GENERATION") {
    summary +=
      ` 已草拟 ${report.nextGenerationPlans.length} 段下一代路线，` +
      "由 Founder 在 /system/training-factory-calculus 确认后再调度。";
  } else if (picked.focus === "COST") {
    summary +=
      ` 已估算 ${report.costSamples.length} 个样例成本：` +
      "本机慢跑获本机收益与血统积累，服务器爆发缩短关键路径。";
  } else if (picked.focus === "WEIGHT") {
    summary +=
      ` 已对 ${report.weightSamples.length} 个数据源计算 datasetWeight，` +
      "用于下一轮 DatasetMixture 与 Reweighting。";
  } else if (picked.focus === "RECURSIVE") {
    summary +=
      ` 已为 ${report.recursivePlan.length} 代 AetherSeed 定义反哺能力，` +
      "300M 起开始反哺数据清洗与样本扩增。";
  } else if (picked.focus === "QUADRANT") {
    const q = picked.quadrant;
    summary += q
      ? ` 重点查看 ${q} 象。`
      : " 四象（Skeleton / Muscle / Blood / Nerve）已就位。";
  } else if (picked.focus === "FLOW") {
    summary += ` 完整流程包含 ${report.calculusFlow.length} 步。`;
  } else if (picked.focus === "FORGE_ASSIGN") {
    summary += " 炉火分配遵循：≥300M 推荐服务器，其余优先本机慢跑。";
  } else {
    summary +=
      ` 计算法 ${report.calculusFlow.length} 步、` +
      `数据集 ${report.datasetVersions.length} 套、` +
      `实验 ${report.experiments.length} 项。`;
  }

  return {
    question: raw,
    focus: picked.focus,
    focusLabel: FOCUS_LABEL[picked.focus],
    summary,
    report,
    highlightedQuadrant: picked.quadrant,
  };
}
